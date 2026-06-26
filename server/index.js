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
