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
import { getDiscordWebhookBody, getEmptyDiscordWebhookBody } from './discord';

export default {
  async fetch(req) {
    const url = new URL(req.url);
    url.pathname = '/__scheduled';
    url.searchParams.append('cron', '* * * * *');
    return new Response(`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`);
  },

  async scheduled(event, env): Promise<void> {
    try {
      const tickerSymbols = ['AAPL', 'TSLA', 'ADBE'];

      const alpacaClient = new AlpacaClient(env.ALPACA_API_KEY, env.ALPACA_API_SECRET);
      const barsTask = await alpacaClient.getBars(tickerSymbols);
      const latestPricesTask = await alpacaClient.getLatestPrices(tickerSymbols);

      const [bars, latestPrices] = await Promise.all([barsTask, latestPricesTask]);

      const results = await checkBollingerBands(bars, latestPrices);

      if (results.length === 0) {
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(getEmptyDiscordWebhookBody('Nothing Passed')),
        });
      } else {
        const discordFields = results.map((result) => {
          return [
            {
              name: result.symbol,
              value: result.type === 'SELL_CALL' ? 'Sell CALLS' : 'Sell PUTS',
            },
            {
              name: result.result,
              value: result.resultValue,
            },
            {
              name: result.optionsTableTitle,
              value: result.optionsTable,
            },
          ];
        });

        // Send Discord webhook requests in parallel
        const webhookPromises = discordFields.map(fields => 
          fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(getDiscordWebhookBody(fields)),
          })
        );
        
        const webhookResults = await Promise.allSettled(webhookPromises);
        
        // Log any failed webhook requests
        webhookResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Discord webhook request ${index + 1} failed:`, result.reason);
          }
        });
        
        const successCount = webhookResults.filter(result => result.status === 'fulfilled').length;
        const failureCount = webhookResults.filter(result => result.status === 'rejected').length;
        
        console.log(`Discord webhook results: ${successCount} succeeded, ${failureCount} failed`);
      }

      // You could store this result in KV, write to a D1 Database, or publish to a Queue.
      console.log(`trigger fired at ${event.cron}`);
    } catch (err) {
      console.error('Scheduled event failed:', err);
    }
  },
} satisfies ExportedHandler<Env>;
