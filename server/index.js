import { PrismaClient } from "@prisma/client";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// CREATE — Add a new user
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ — Get all users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});
