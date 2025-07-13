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

import { getDiscordWebhookBody } from './discord';

export default {
  async fetch(req) {
    const url = new URL(req.url);
    url.pathname = '/__scheduled';
    url.searchParams.append('cron', '* * * * *');
    return new Response(`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`);
  },

  async scheduled(event, env, ctx): Promise<void> {
    const tickerSymbols = ['AAPL', 'TSLA'];

    const fields = tickerSymbols
      .map((ticker) => {
        return {
          name: ticker,
          value: `Bollinger Band Alert for ${ticker}`,
        };
      })
      .slice(0, 10);

    const resp = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getDiscordWebhookBody(fields)),
    });
    let wasSuccessful = resp.ok ? 'success' : 'fail';

    // You could store this result in KV, write to a D1 Database, or publish to a Queue.
    console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
  },
} satisfies ExportedHandler<Env>;
