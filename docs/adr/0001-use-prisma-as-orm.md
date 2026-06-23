# ADR-0001: Use Prisma as ORM

## Status
Accepted

## Date
2026-06-06

## Context

The project requires an ORM for PostgreSQL.
The team evaluated:

- Prisma
- Sequelize

Requirements:

- Type safety
- Good developer experience
- Migration support

## Decision

We will use Prisma as the primary ORM.

## Reasons

1. End-to-end TypeScript support.
2. Better autocomplete and type generation.
3. Simpler schema management.
4. Strong migration tooling.
5. Faster onboarding for new developers.

## Consequences

### Positive

- Improved developer productivity.
- Easier maintenance.

### Negative

- Less flexibility for highly dynamic queries.
- Team needs to learn Prisma schema syntax.

## Alternatives Considered

### Sequelize

Pros:
- Mature ecosystem.
- Flexible query building.

Cons:
- Weaker TypeScript experience.
- More boilerplate.

## Final Verdict

### For Our eSewa-like Payment Project:

```
┌─────────────────────────────────────────────────┐
│                                                  │
│            ✅ PRISMA IS THE RIGHT CHOICE         │
│                                                  │
│  ✅ Faster setup (we have < 1 month)            │
│  ✅ Less code to write and maintain              │
│  ✅ Better migration system (auto-generated)     │
│  ✅ Cleaner query syntax (fewer bugs)            │
│  ✅ Better documentation (faster learning)       │
│  ✅ Built-in Studio (visual debugging)           │
│  ✅ Single schema file (easier collaboration)    │
│  ✅ Modern, actively developed                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### References

| Source | URL |
|--------|-----|
| Prisma Official Docs | [prisma.io/docs](https://prisma.io/docs) |
| Sequelize Official Docs | [sequelize.org](https://sequelize.org) |
| Prisma vs Sequelize (Prisma Blog) | [prisma.io/docs/orm/more/comparisons/prisma-and-sequelize](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-sequelize) |
