# Project Documentation

This directory contains project documentation, setup guides, and architecture decisions.

## Documentation Structure

### Architecture Decision Records (ADR)

ADRs capture important technical decisions made by the team, including the reasoning, alternatives considered, and consequences.

Location:

```text
docs/adr/
```

Current ADRs:

| ADR  | Description       |
| ---- | ----------------- |
| 0001 | Use Prisma as ORM |

---

### Setup Guides

Setup guides help developers get started and understand project-specific tooling and workflows.

Location:

```text
docs/setup/
```

Available Guides:

| Guide           | Description                                               |
| --------------- | --------------------------------------------------------- |
| prisma-setup.md | Prisma installation, migrations, and development workflow |

---

## When to Create an ADR

Create an ADR when:

* A significant technical decision is made
* Multiple alternatives were evaluated
* The decision impacts the project's architecture
* Future team members may ask "Why was this chosen?"

Examples:

* ORM selection (Prisma vs Sequelize)
* Database selection
* Authentication strategy
* Caching strategy
* Deployment architecture

---

## When to Create a Setup Guide

Create a setup guide when:

* A tool requires project-specific configuration
* New team members need onboarding instructions
* The setup process is more than a few commands

Examples:

* Prisma setup
* Docker setup
* CI/CD setup
* Local development environment setup

---

## Contributing to Documentation

When introducing a new technology or architectural decision:

1. Add or update the relevant setup guide.
2. Create an ADR if the decision affects the project's architecture.
3. Update this index to include the new documentation.

