#  Prisma ORM — Step-by-Step Setup Guide

> **Language:** JavaScript (ES Modules) — No TypeScript required
> **Prisma Version:** `6.19.3`
> **Database:** PostgreSQL (works with MySQL, SQLite, etc. too)

---

## Table of Contents

1. [Prerequisites](#step-0-prerequisites)
2. [Initialize Node.js Project](#step-1-initialize-nodejs-project)
3. [Install Dependencies](#step-2-install-dependencies)
4. [Initialize Prisma](#step-3-initialize-prisma)
5. [Configure Database Connection](#step-4-configure-database-connection)
6. [Define Your Schema (Models)](#step-5-define-your-schema-models)
7. [Create Migration & Apply to Database](#step-6-create-migration--apply-to-database)
8. [Generate Prisma Client](#step-7-generate-prisma-client)
9. [Write Application Code (CRUD)](#step-8-write-application-code-crud)
10. [Browse Data with Prisma Studio](#step-9-browse-data-with-prisma-studio)
11. [Adding New Tables/Columns (Schema Changes)](#step-10-adding-new-tablescolumns-schema-changes)
12. [Relationships Between Tables](#step-11-relationships-between-tables)
13. [Advanced Prisma Queries](#step-12-advanced-prisma-queries)
14. [Common Errors & Troubleshooting](#step-13-common-errors--troubleshooting)
15. [Quick Reference Cheat Sheet](#step-14-quick-reference-cheat-sheet)

---

## Step 0: Prerequisites

Before starting, make sure you have:

| Tool | Required Version | Check Command | Install Guide |
|------|-----------------|---------------|---------------|
| **Node.js** | v18 or higher | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | v9 or higher | `npm --version` | Comes with Node.js |
| **PostgreSQL** | Any recent version | — | Use [Aiven](https://aiven.io), [Supabase](https://supabase.com), [Neon](https://neon.tech), or install locally |
| **Code Editor** | Any | — | VS Code recommended |

> [!TIP]
> You don't need PostgreSQL installed locally! You can use a **free cloud database** from Aiven, Supabase, or Neon. Just get the connection string (URL).

---

## Step 1: Initialize Node.js Project

Create a new folder for your project and initialize it:

```bash
# Create project folder
mkdir my-project
cd my-project

# Initialize package.json
npm init -y
```

This creates a `package.json` file. Now, add ES Module support by editing it:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node --watch index.js"
  }
}
```

> [!IMPORTANT]
> **`"type": "module"`** is essential! Without it, you'll get errors when using `import` statements. This tells Node.js to use modern ES Module syntax instead of the older `require()` syntax.

---

## Step 2: Install Dependencies

Install the required packages:

```bash
# Runtime dependencies (needed when app runs)
npm install @prisma/client@6.19.3 express dotenv

# Dev dependency (only needed for CLI commands during development)
npm install --save-dev prisma@6.19.3
```

**What each package does:**

| Package | Type | Purpose |
|---------|------|---------|
| `@prisma/client@6.19.3` | Runtime | The auto-generated client you import in your code |
| `express` | Runtime | Web framework for creating API endpoints |
| `dotenv` | Runtime | Loads variables from `.env` file |
| `prisma@6.19.3` | Dev | The CLI tool for migrations, generation, etc. |

> [!WARNING]
> **Always use the exact same version** for both `prisma` and `@prisma/client`. Version mismatch will cause errors!
> We use `6.19.3` specifically because it works cleanly with plain JavaScript (no TypeScript config needed).

---

## Step 3: Initialize Prisma

Run the Prisma init command:

```bash
npx prisma init
```

**This creates two files:**

```
my-project/
├── prisma/
│   └── schema.prisma    ← Your database schema definition
├── .env                 ← Environment variables (database URL goes here)
├── package.json
└── package-lock.json
```

**Output you'll see:**
```
✔ Your Prisma schema was created at prisma/schema.prisma
  You can now open it in your favorite editor.

Next steps:
1. Set the DATABASE_URL in the .env file to point to your existing database.
2. Set the provider of the datasource block in schema.prisma to match your database.
3. Run prisma db pull to turn your database schema into a Prisma schema.
4. Run prisma generate to generate the Prisma Client.
```

---

## Step 4: Configure Database Connection

### 4.1 Set the Database URL

Open `.env` and replace the placeholder with your actual database connection string:

```bash
# .env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOSTNAME:PORT/DATABASE_NAME?sslmode=require"
```

**Examples for different providers:**

```bash
# Aiven Cloud PostgreSQL
DATABASE_URL="postgres://avnadmin:your_password@pg-xxxxx.aivencloud.com:28667/defaultdb?sslmode=no-verify"

# Supabase
DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres"

# Neon
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"
```

### 4.2 Verify schema.prisma

Make sure `prisma/schema.prisma` has the correct provider:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"    // Change to "mysql" or "sqlite" if needed
  url      = env("DATABASE_URL")
}
```

> [!CAUTION]
> **Never hardcode your database URL** in `schema.prisma`! Always use `env("DATABASE_URL")` and keep the actual URL in `.env`. Add `.env` to your `.gitignore` to prevent accidentally pushing credentials to GitHub.

### 4.3 Create `.gitignore`

```bash
# .gitignore
node_modules
.env
/generated/prisma
```

---

## Step 5: Define Your Schema (Models)

Open `prisma/schema.prisma` and define your database tables as models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Define your tables below ──

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  description String?
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
}
```

### Understanding the Schema Syntax

#### Data Types

| Prisma Type | PostgreSQL Type | JavaScript Type | Example |
|-------------|----------------|-----------------|---------|
| `String` | `TEXT` | `string` | `"Hello"` |
| `Int` | `INTEGER` | `number` | `42` |
| `Float` | `DOUBLE PRECISION` | `number` | `3.14` |
| `Boolean` | `BOOLEAN` | `boolean` | `true` |
| `DateTime` | `TIMESTAMP(3)` | `Date` | `new Date()` |
| `BigInt` | `BIGINT` | `BigInt` | `9007199254740991n` |
| `Decimal` | `DECIMAL(65,30)` | `Decimal` | Precise money values |
| `Json` | `JSONB` | `object` | `{ key: "value" }` |

#### Field Attributes

| Attribute | Meaning | Example |
|-----------|---------|---------|
| `@id` | Primary key | `id Int @id` |
| `@default(autoincrement())` | Auto-incrementing integer | `id Int @id @default(autoincrement())` |
| `@default(uuid())` | Auto-generated UUID | `id String @id @default(uuid())` |
| `@default(now())` | Current timestamp | `createdAt DateTime @default(now())` |
| `@default("value")` | Custom default value | `role String @default("user")` |
| `@unique` | Unique constraint | `email String @unique` |
| `@updatedAt` | Auto-updates on modification | `updatedAt DateTime @updatedAt` |
| `?` | Nullable (optional) field | `description String?` |
| `@db.VarChar(255)` | Use specific native type | `name String @db.VarChar(255)` |

#### Model-Level Attributes

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String
  name  String

  @@unique([email, name])     // Composite unique constraint
  @@index([email])            // Database index for faster queries
  @@map("my_users")           // Map to a different table name in DB
}
```

---

## Step 6: Create Migration & Apply to Database

Run the migration command:

```bash
npx prisma migrate dev --name init
```

**What happens:**
1. Prisma reads your `schema.prisma`
2. Compares it with the current database state
3. Generates SQL in `prisma/migrations/<timestamp>_init/migration.sql`
4. Executes the SQL on your database
5. Auto-runs `npx prisma generate`

**Output you'll see:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "defaultdb"

Applying migration `20260604020423_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260604020423_init/
    └─ migration.sql

Your database is now in sync with your schema.
Running generate... (Use --skip-generate to skip the generators)
Generated Prisma Client to ./node_modules/@prisma/client
```

**The generated SQL file will look like:**
```sql
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

> [!NOTE]
> **Naming tip:** Give your migrations descriptive names like `init`, `add_users_table`, `add_payment_fields`. This makes it easy to understand the migration history.

---

## Step 7: Generate Prisma Client

If you need to regenerate the client manually (without migrating):

```bash
npx prisma generate
```

**When do you need this?**
- After pulling new code from Git (your teammate added new models)
- After modifying `schema.prisma` without running migrations
- After running `npm install` (sometimes the generated client is lost)

**After generation, you can import:**
```javascript
import { PrismaClient } from "@prisma/client";
```

---

## Step 8: Write Application Code (CRUD)

Create `index.js`:

```javascript
import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════
// CREATE — Add a new user
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// READ — Get all users
// ═══════════════════════════════════════════════════
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// ═══════════════════════════════════════════════════
// READ — Get a single user by ID
// ═══════════════════════════════════════════════════
app.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// ═══════════════════════════════════════════════════
// UPDATE — Update a user by ID
// ═══════════════════════════════════════════════════
app.put("/users/:id", async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email },
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// DELETE — Delete a user by ID
// ═══════════════════════════════════════════════════
app.delete("/users/:id", async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════════
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

**Run it:**
```bash
npm start
```

**Test with curl or Postman:**

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Binita", "email": "binita@example.com", "password": "secret123"}'

# Get all users
curl http://localhost:3000/users

# Get single user
curl http://localhost:3000/users/1

# Update user
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Binita Hamal", "email": "binita@updated.com"}'

# Delete user
curl -X DELETE http://localhost:3000/users/1
```

---

## Step 9: Browse Data with Prisma Studio

Prisma comes with a built-in database browser:

```bash
npx prisma studio
```

This opens `http://localhost:5555` in your browser where you can:
- View all your tables
- Browse records
- Add new records
- Edit existing records
- Delete records

> [!TIP]
> Use Prisma Studio to quickly check if your CRUD operations are working correctly. It's much faster than writing SQL queries in a terminal.

---

## Step 10: Adding New Tables/Columns (Schema Changes)

### Adding a New Column to an Existing Table

Edit `schema.prisma`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  role      String   @default("user")
  phone     String?                     // ← NEW COLUMN (optional)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Run migration:

```bash
npx prisma migrate dev --name add_phone_to_user
```

### Adding a New Table

Add a new model to `schema.prisma`:

```prisma
model Payment {
  id            Int      @id @default(autoincrement())
  amount        Float
  status        String   @default("pending")
  transactionId String   @unique
  createdAt     DateTime @default(now())
}
```

Run migration:

```bash
npx prisma migrate dev --name add_payment_table
```

> [!IMPORTANT]
> **Always run `npx prisma migrate dev` after changing `schema.prisma`!** This is the step that actually creates/modifies the database tables. Just editing the schema file does nothing to the database.

---

## Step 11: Relationships Between Tables

### One-to-Many (1 User → Many Payments)

```prisma
model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  name     String
  payments Payment[]   // ← One user has many payments
}

model Payment {
  id            Int      @id @default(autoincrement())
  amount        Float
  status        String   @default("pending")
  transactionId String   @unique
  userId        Int                    // ← Foreign key
  user          User     @relation(fields: [userId], references: [id])
  createdAt     DateTime @default(now())
}
```

**Query with relationships:**

```javascript
// Create user with payment
const user = await prisma.user.create({
  data: {
    name: "Binita",
    email: "binita@example.com",
    payments: {
      create: {
        amount: 500.0,
        transactionId: "TXN-001",
      },
    },
  },
  include: {
    payments: true, // Include related payments in the response
  },
});

// Get user with all their payments
const userWithPayments = await prisma.user.findUnique({
  where: { id: 1 },
  include: { payments: true },
});
```

### Many-to-Many (Users ↔ Roles)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  roles Role[]
}

model Role {
  id    Int    @id @default(autoincrement())
  name  String @unique
  users User[]
}
```

> [!NOTE]
> Prisma automatically creates a join table for many-to-many relationships. You don't need to define it yourself.

---

## Step 12: Advanced Prisma Queries

### Filtering

```javascript
// Find users where name contains "Binita"
const users = await prisma.user.findMany({
  where: {
    name: { contains: "Binita" },
  },
});

// Find users created after a date
const recentUsers = await prisma.user.findMany({
  where: {
    createdAt: { gte: new Date("2026-01-01") },
  },
});

// Multiple conditions (AND)
const filtered = await prisma.user.findMany({
  where: {
    AND: [
      { role: "admin" },
      { email: { endsWith: "@example.com" } },
    ],
  },
});

// OR condition
const result = await prisma.user.findMany({
  where: {
    OR: [
      { name: "Binita" },
      { name: "Sita" },
    ],
  },
});
```

### Sorting & Pagination

```javascript
// Sort by name ascending
const sorted = await prisma.user.findMany({
  orderBy: { name: "asc" },
});

// Pagination (skip 10, take 5)
const page = await prisma.user.findMany({
  skip: 10,
  take: 5,
  orderBy: { createdAt: "desc" },
});
```

### Select Specific Fields

```javascript
// Only get id and email (not password!)
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // password is NOT included
  },
});
```

### Aggregations

```javascript
// Count users
const count = await prisma.user.count();

// Sum of all payment amounts
const total = await prisma.payment.aggregate({
  _sum: { amount: true },
  _avg: { amount: true },
  _count: true,
});
```

### Transactions (Multiple Operations as One)

```javascript
// Both operations succeed or both fail
const result = await prisma.$transaction([
  prisma.user.create({ data: { name: "Binita", email: "b@e.com", password: "123" } }),
  prisma.payment.create({ data: { amount: 100, transactionId: "TXN-1", userId: 1 } }),
]);
```

### Raw SQL (When Prisma Queries Aren't Enough)

```javascript
// Execute raw SQL
const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE "email" LIKE '%@gmail.com'`;

// Execute raw SQL for mutations
await prisma.$executeRaw`UPDATE "User" SET "role" = 'admin' WHERE "id" = 1`;
```

---

## Step 13: Common Errors & Troubleshooting

### Error: "PrismaClientInitializationError: Can't reach database server"

**Cause:** Wrong `DATABASE_URL` or database is not running.

**Fix:**
```bash
# Check your .env file
cat .env

# Test connection
npx prisma db pull
```

---

### Error: "prisma generate is not recognized"

**Cause:** `prisma` not installed as devDependency.

**Fix:**
```bash
npm install --save-dev prisma@6.19.3
```

---

### Error: "The migration ... was modified after it was applied"

**Cause:** Someone edited a migration.sql file after it was already applied.

**Fix:**
```bash
# Reset the database (WARNING: deletes all data!)
npx prisma migrate reset
```

---

### Error: "Environment variable not found: DATABASE_URL"

**Cause:** `.env` file missing or `DATABASE_URL` not defined.

**Fix:** Create `.env` in your project root (same level as `package.json`) with:
```bash
DATABASE_URL="your_connection_string_here"
```

---

### Error: "Module not found: @prisma/client"

**Cause:** Client not generated yet.

**Fix:**
```bash
npx prisma generate
```

---

### Error: "ENOENT: no such file or directory ... schema.prisma"

**Cause:** Running Prisma command from wrong directory.

**Fix:** Make sure you're in the root directory of your project (where `package.json` is located).

---

## Step 14: Quick Reference Cheat Sheet

### CLI Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx prisma init` | Set up Prisma (creates schema + .env) | Once, at project start |
| `npx prisma migrate dev --name <name>` | Create & apply migration | After changing schema.prisma |
| `npx prisma generate` | Regenerate client | After pulling code / schema changes |
| `npx prisma studio` | Open visual database browser | Anytime during development |
| `npx prisma migrate reset` | Reset database (delete all data) | When migrations are broken |
| `npx prisma db pull` | Pull existing DB schema into Prisma | When connecting to existing DB |
| `npx prisma db push` | Push schema to DB without migration | Quick prototyping only |
| `npx prisma format` | Auto-format schema.prisma | After editing schema |

### CRUD Operations

```javascript
// CREATE
prisma.user.create({ data: { name: "Binita", email: "b@e.com" } })

// READ (all)
prisma.user.findMany()

// READ (one)
prisma.user.findUnique({ where: { id: 1 } })

// READ (first match)
prisma.user.findFirst({ where: { name: "Binita" } })

// UPDATE
prisma.user.update({ where: { id: 1 }, data: { name: "Updated" } })

// DELETE
prisma.user.delete({ where: { id: 1 } })

// UPSERT (create or update)
prisma.user.upsert({
  where: { email: "b@e.com" },
  update: { name: "Updated" },
  create: { name: "New", email: "b@e.com" },
})
```

### Complete Project Setup (Copy-Paste Ready)

```bash
# 1. Create project
mkdir my-project && cd my-project
npm init -y

# 2. Add "type": "module" to package.json (manually)

# 3. Install dependencies
npm install @prisma/client@6.19.3 express dotenv
npm install --save-dev prisma@6.19.3

# 4. Initialize Prisma
npx prisma init

# 5. Edit .env with your DATABASE_URL
# 6. Edit prisma/schema.prisma with your models

# 7. Create and apply migration
npx prisma migrate dev --name init

# 8. Create index.js and write your code
# 9. Run the server
npm start
```

---

