# Cron Worker

This is a Cloudflare Worker with cron triggers

## Local development

Starts up a local server for developing your Worker
```
pnpm dev
```

Deploy your Wroker to Cloudflare
```
pnpm run deploy --env=""
```

Deploy to `prod` env
```
pnpm run deploy --env=prod
```

Adding secrets to cloudflare workers
```
npx wrangler secret put secret-name --env=""
```

Generate types based on your Worker configuration
```
pnpm cf-typegen
```

Test scripts for the alpaca sdk
```
pnpm alpaca
```
