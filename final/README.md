# Smart Campus — Room Availability Checker

A React + TypeScript application that lets students select a university room and check whether it is available for a requested time interval, using fictional room and booking data. No backend, no saved bookings.

## Setup

```bash
npm ci
```

## Local startup

```bash
npm run dev
```

## Verification commands

```bash
npm test -- --pool=threads --poolOptions.threads.singleThread --reporter=verbose
npm run typecheck
npm run lint
npm run build
```

See [AGENTS.md](AGENTS.md) for project rules and contribution constraints.
