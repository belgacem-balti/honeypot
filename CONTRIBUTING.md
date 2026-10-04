# Contributing to TaskFlow

Thank you for taking the time to contribute! 🎉

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies from the root:
   ```bash
   npm run install:all
   ```
3. Copy the environment template and fill in values:
   ```bash
   cp server/.env.example server/.env
   ```
4. Start the full local stack with Docker:
   ```bash
   docker compose up --build
   ```
   Or run without Docker (requires local PostgreSQL, Redis, RabbitMQ):
   ```bash
   npm run dev
   ```

## Project Structure

```
honeypot/
├── client/   # React 18 SPA (Vite + Tailwind)
├── server/   # Express API + background worker
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/      # redis, queue, shards, scaling
│   │   ├── utils/
│   │   └── workers/
│   └── prisma/schema.prisma
├── k8s/      # Kubernetes manifests
└── infra/    # Nginx load-balancer config
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without behaviour change |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling |

Example: `feat(tasks): add due-date reminder notifications`

## Running Tests

```bash
cd server
npm test
```

## Code Style

- **Backend**: Node.js CommonJS modules, Express conventions
- **Frontend**: React functional components, hooks only (no class components)
- Keep business logic in `services/`, not in controllers
- All API responses must use the `successResponse` / `errorResponse` helpers

## Environment & Secrets

- Never commit `.env` files or real credentials
- Use `server/.env.example` as the source of truth for required variables
- Generate a strong JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Pull Request Guidelines

- One feature / fix per PR
- Keep PRs small and focused
- Update relevant documentation if needed
- Ensure `npm test` passes before opening a PR

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
