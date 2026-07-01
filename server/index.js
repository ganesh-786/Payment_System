import { PrismaClient } from "@prisma/client";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../client/dist");
const clientPath = fs.existsSync(clientDist)
  ? clientDist
  : path.resolve(__dirname, "../client");
const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(express.static(clientPath));

// Rate limiter for transfer endpoint (rate limit per user)
const transferLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // default 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5, // default 5 requests per window
  keyGenerator: (req) => {
    const rawToken = getToken(req);
    if (rawToken) {
      try {
        const payload = jwt.verify(rawToken, JWT_SECRET);
        return payload.userId.toString();
      } catch {
        return ipKeyGenerator(req);
      }
    }
    return ipKeyGenerator(req);
  },
});

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const IS_PROD = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "strict",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

function signToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "8h",
  });
}

function getToken(req) {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=");
        return [key, val.join("=")];
      }),
    );
    if (cookies.token) return cookies.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

async function getUserResponse(user) {
  // Fetch wallet balance if exists
  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    select: { balance: true },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    walletBalance: wallet ? wallet.balance : 0,
  };
}

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create associated wallet with zero balance
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 1000,
        version: 0,
      },
    });

    const token = signToken(user);
    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ user: await getUserResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create account." });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ user: await getUserResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to sign in." });
  }
});

// Transfer endpoint with optimistic locking and rate limiting
app.post("/api/transfer", transferLimiter, async (req, res) => {
  try {
    const rawToken = getToken(req);
    if (!rawToken) {
      return res.status(401).json({ error: "Missing authorization token." });
    }
    const payload = jwt.verify(rawToken, JWT_SECRET);
    const fromUserId = payload.userId;
    const { toUserEmail, amount, memo } = req.body;

    if (!toUserEmail || !amount || amount <= 0) {
      return res.status(400).json({ error: "toUserEmail and positive amount are required." });
    }

    // Resolve recipient by email
    const recipientUser = await prisma.user.findUnique({
      where: { email: toUserEmail },
    });
    if (!recipientUser) {
      return res.status(404).json({ error: "Recipient user not found by email." });
    }
    const toUserId = recipientUser.id;

    if (toUserId === fromUserId) {
      return res.status(400).json({ error: "Cannot transfer to self." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Load sender wallet with version
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: fromUserId },
        select: { id: true, balance: true, version: true },
      });
      if (!senderWallet) {
        throw new Error("Sender wallet not found");
      }
      if (senderWallet.balance < amount) {
        throw new Error("Insufficient funds");
      }
      // Load receiver wallet (auto‑create if missing for testing)
      let receiverWallet = await tx.wallet.findUnique({
        where: { userId: toUserId },
        select: { id: true, balance: true, version: true },
      });
      if (!receiverWallet) {
        receiverWallet = await tx.wallet.create({
          data: { userId: toUserId, balance: 1000, version: 0 },
          select: { id: true, balance: true, version: true },
        });
      }

      // Debit sender with optimistic version check
      const debit = await tx.wallet.updateMany({
        where: { id: senderWallet.id, version: senderWallet.version },
        data: { balance: { decrement: amount }, version: { increment: 1 } },
      });
      // Credit receiver with version check
      const credit = await tx.wallet.updateMany({
        where: { id: receiverWallet.id, version: receiverWallet.version },
        data: { balance: { increment: amount }, version: { increment: 1 } },
      });

      if (debit.count !== 1 || credit.count !== 1) {
        // Optimistic lock conflict
        throw new Error("Optimistic lock failure");
      }

      // Create immutable transaction record
      const transaction = await tx.transaction.create({
        data: {
          fromWalletId: senderWallet.id,
          toWalletId: receiverWallet.id,
          amount,
          memo,
        },
      });
      return transaction;
    });
    // Success
    res.json({ transaction: result });
  } catch (error) {
    console.error(error);
    if (error.message === "Insufficient funds") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Recipient wallet not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Sender wallet not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Optimistic lock failure") {
      return res.status(409).json({ error: "Concurrent transfer conflict, please retry." });
    }
    return res.status(500).json({ error: "Transfer failed." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ success: true });
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const rawToken = getToken(req);
    if (!rawToken) {
      return res.status(401).json({ error: "Missing authorization token." });
    }

    const payload = jwt.verify(rawToken, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token." });
    }

    const profile = await getUserResponse(user);
    res.json({ user: profile });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Authentication failed." });
  }
});

// ── Statement / Payment History ──

// Helper to authenticate and get user wallet
async function authenticateUser(req) {
  const rawToken = getToken(req);
  if (!rawToken) return null;
  const payload = jwt.verify(rawToken, JWT_SECRET);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return null;
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) return null;
  return { user, wallet };
}

// List transactions for the authenticated user (with filters + pagination)
app.get("/api/transactions", async (req, res) => {
  try {
    const auth = await authenticateUser(req);
    if (!auth) return res.status(401).json({ error: "Missing or invalid authorization token." });

    const walletId = auth.wallet.id;
    const currentBalance = auth.wallet.balance;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const type = req.query.type || "all";
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const where = { OR: [{ fromWalletId: walletId }, { toWalletId: walletId }] };

    if (type === "sent") {
      where.OR = [{ fromWalletId: walletId }];
    } else if (type === "received") {
      where.OR = [{ toWalletId: walletId }];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const total = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        fromWallet: { include: { user: { select: { name: true, email: true } } } },
        toWallet: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    // Compute running balance for each transaction on the page
    let runningBalance = currentBalance;
    const balanceMap = {};

    if (transactions.length > 0) {
      const oldestOnPage = transactions[transactions.length - 1];
      const newerTxns = await prisma.transaction.findMany({
        where: {
          OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
          createdAt: { gte: oldestOnPage.createdAt },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, fromWalletId: true, toWalletId: true },
      });

      for (const t of newerTxns) {
        balanceMap[t.id] = runningBalance;
        if (t.fromWalletId === walletId) runningBalance += t.amount;
        else runningBalance -= t.amount;
      }
    }

    const enriched = transactions.map((txn) => ({
      id: txn.id,
      reference: `TXN${String(txn.id).padStart(8, "0")}`,
      amount: txn.amount,
      memo: txn.memo,
      status: "completed",
      type: txn.fromWalletId === walletId ? "sent" : "received",
      sender: { name: txn.fromWallet.user.name, email: txn.fromWallet.user.email },
      receiver: { name: txn.toWallet.user.name, email: txn.toWallet.user.email },
      runningBalance: balanceMap[txn.id] ?? null,
      createdAt: txn.createdAt,
    }));

    res.json({ transactions: enriched, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

// Single transaction detail
app.get("/api/transactions/:id", async (req, res) => {
  try {
    const auth = await authenticateUser(req);
    if (!auth) return res.status(401).json({ error: "Missing or invalid authorization token." });

    const txnId = parseInt(req.params.id);
    if (isNaN(txnId)) return res.status(400).json({ error: "Invalid transaction ID." });

    const txn = await prisma.transaction.findUnique({
      where: { id: txnId },
      include: {
        fromWallet: { include: { user: { select: { name: true, email: true } } } },
        toWallet: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!txn) return res.status(404).json({ error: "Transaction not found." });

    const walletId = auth.wallet.id;
    if (txn.fromWalletId !== walletId && txn.toWalletId !== walletId) {
      return res.status(403).json({ error: "Access denied." });
    }

    const isSent = txn.fromWalletId === walletId;

    res.json({
      transaction: {
        id: txn.id,
        reference: `TXN${String(txn.id).padStart(8, "0")}`,
        amount: txn.amount,
        memo: txn.memo,
        status: "completed",
        type: isSent ? "sent" : "received",
        sender: { name: txn.fromWallet.user.name, email: txn.fromWallet.user.email },
        receiver: { name: txn.toWallet.user.name, email: txn.toWallet.user.email },
        createdAt: txn.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transaction." });
  }
});

// ── SPA fallback & error handler ──

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }

  const indexFile = path.join(clientPath, "index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  res.status(404).send("Not found");
});

const PORT = process.env.PORT || 3000;

async function main() {
  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Unable to start server:", error);
  process.exit(1);
});
