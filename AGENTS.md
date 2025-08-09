# AGENTS.md - Development Guidelines for AI Coding Agents

## Build/Lint/Test Commands
- **Development**: `pnpm dev` (starts local Cloudflare Worker server)
- **Format code**: `pnpm format` (runs Prettier)
- **Format check**: `pnpm format:check` (checks Prettier compliance)
- **Lint**: `pnpm lint` (runs ESLint on src/)
- **Type check**: `pnpm typecheck` (TypeScript type checking)
- **Test scripts**: `pnpm alpaca`, `pnpm yahoo`, `pnpm rsi` (run individual test scripts in testscripts/)
- **Deploy**: `pnpm deploy` (dev), `pnpm deploy:prod` (production)
- **Test**: `pnpm run test` (runs vitest)

## Code Style Guidelines
- **ESM modules**: Use ES modules (`import`/`export`), project is `"type": "module"`
- **TypeScript**: Strict TypeScript enabled - always use proper types, no `any`
- **Formatting**: Prettier with 140 print width, single quotes, semicolons required
- **Imports**: Use relative paths for local modules, organize by external/internal
- **Naming**: Use camelCase for variables/functions, PascalCase for types/interfaces/classes
- **Error handling**: Always wrap async operations in try-catch blocks, log errors with context
- **Console logging**: Include structured logging with timestamps and component tags (e.g., `[BollingerChecker][date()]`)
- **Functions**: Prefer arrow functions for simple operations, use proper JSDoc for exported functions
- **File structure**: Separate concerns into utils/, checkers/, data/ directories
- **Environment**: This is a Cloudflare Worker project using Wrangler for deployment and cron triggers
- **Tests**: Always use vitest for writing unittests
