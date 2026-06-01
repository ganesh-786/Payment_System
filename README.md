# 💳 Payment System

## Overview

This project is a **backend payment system** inspired by eSewa/Khalti, built with a focus on:

- Financial correctness
- Distributed systems design
- Backend interview readiness

It implements real-world payment system patterns such as:

- Double-entry ledger
- Idempotent transactions
- Saga-based workflows
- Event-driven architecture

---

## 🚀 Tech Stack

### Core Backend

- Node.js (TypeScript)
- Fastify (high-performance HTTP framework)
- Prisma ORM
- PostgreSQL (ACID-compliant financial storage)

### Infrastructure

- Docker & Docker Compose
- Redis (caching, idempotency, rate limiting)
- Kafka (event-driven communication)
- MinIO (object storage for KYC)

### Observability

- Pino (structured logging)
- Prometheus (metrics)
- OpenTelemetry (tracing)

### Testing

- Jest (unit + integration)
- Testcontainers (real DB in tests)
- k6 (load testing)

---

## 🧠 Key Architecture Decisions

### 1. Modular Monolith

- Clear domain boundaries
- Easier to develop within 1 month
- Future-ready for microservices

### 2. Double-Entry Ledger

- Every transaction = debit + credit
- Immutable ledger entries
- Financial correctness guaranteed

### 3. Idempotency

- Prevents duplicate payments
- Redis + DB-level enforcement

### 4. Integer Money Storage

- All money stored as `BIGINT` (paisa)
- Avoids floating point errors

---

## 📦 Project Structure

- `apps/api` → Main backend service
- `apps/worker` → Kafka consumers
- `packages/shared-types` → Shared DTOs
- `infra/` → Docker, Terraform, K8s
- `docs/` → Architecture & ADRs

---

## ⚙️ Getting Started

### 1. Clone Repo

```bash
git clone https://github.com/your-team/esewa-clone
cd esewa-clone
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
cd apps/api
pnpm prisma migrate dev
```

### 5. Seed Data

```bash
pnpm run seed
```

### 6. Start Server

```bash
pnpm run dev
```

---

## 🧪 Testing

```bash
pnpm run test                # Unit tests
pnpm run test:integration    # Integration tests
pnpm run test:coverage       # Coverage report
```

---

## 📊 Load Testing

```bash
pnpm run load-test
```

Target:

- p99 latency < 500ms
- zero double charges

---

## 🔐 Security

- JWT RS256 authentication
- bcrypt password + PIN hashing
- HMAC request signing (merchant APIs)
- Rate limiting (Redis)
- TLS enforced

---

## 📡 Core Features

- User registration + KYC
- Wallet management
- Payment processing
- Merchant integration
- Webhooks with retry
- Refund system
- Ledger reconciliation

---

## 🧠 Interview Topics Covered

You should be able to explain:

- Idempotency
- Optimistic locking
- Saga pattern
- Double-entry accounting
- Event-driven architecture
- ACID vs eventual consistency

---

## 🚧 Scope Limitations

- No frontend (API-first)
- Single currency (NPR)
- No real banking integration

---

## 👥 Team Roles

- Identity & Auth
- Wallet & Balance
- Transactions & Idempotency
- Ledger & Reconciliation

---

## 📄 License

MIT
