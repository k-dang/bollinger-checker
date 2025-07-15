/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
 * - Run `npm run deploy` to publish your Worker
 *
 * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { AlpacaClient } from './alpaca';
import { checkBollingerBands } from './bollingerChecker';
import { getDiscordWebhookBody } from './discord';

export default {
  async fetch(req) {
    const url = new URL(req.url);
    url.pathname = '/__scheduled';
    url.searchParams.append('cron', '* * * * *');
    return new Response(`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`);
  },

  async scheduled(event, env): Promise<void> {
    const tickerSymbols = ['AAPL', 'TSLA'];

    const alpacaClient = new AlpacaClient(env.ALPACA_API_KEY, env.ALPACA_API_SECRET);
    const task1 = await alpacaClient.getBars(tickerSymbols);
    const task2 = await alpacaClient.getLatestPrices(tickerSymbols);

    // Wait for both promises to resolve
    const [bars, latestPrices] = await Promise.all([task1, task2]);

    const results = await checkBollingerBands(bars, latestPrices);

    const fields = results.map((result) => {
      return {
        name: 'Alert',
        value: result,
      };
    });

    const resp = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getDiscordWebhookBody(fields)),
    });
    const wasSuccessful = resp.ok ? 'success' : 'fail';

    // You could store this result in KV, write to a D1 Database, or publish to a Queue.
    console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
  },
} satisfies ExportedHandler<Env>;
