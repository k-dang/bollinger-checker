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

import { AlpacaClient } from './utils/alpaca';
import { checkBollingerBands } from './checkers/bollingerChecker';
import { sendDiscordWebhook, notifyDiscordWithResults } from './utils/discord';
import { tickers as tickerSymbols } from './data/tickers';
import { calculateRSI } from './checkers/rsiChecker';
import { YahooOptionsProvider } from './core/providers/OptionsProvider';

export default {
  async fetch(req) {
    const url = new URL(req.url);
    url.pathname = '/__scheduled';
    url.searchParams.append('cron', '* * * * *');
    return new Response(`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`);
  },

  async scheduled(event, env): Promise<void> {
    try {
      const alpacaClient = new AlpacaClient(env.ALPACA_API_KEY, env.ALPACA_API_SECRET);

      const barsTask = alpacaClient.getBars(tickerSymbols);
      const latestPricesTask = alpacaClient.getLatestPrices(tickerSymbols);
      const [bars, latestPrices] = await Promise.all([barsTask, latestPricesTask]);

      // combine results
      const results = await checkBollingerBands(bars, latestPrices, new YahooOptionsProvider());
      const rsiResults = calculateRSI(bars);

      const extendedResults = results.map((result) => {
        const rsi = rsiResults.get(result.symbol);
        return {
          bollingerResult: result,
          rsiResult: rsi,
        };
      });

      if (results.length === 0) {
        await sendDiscordWebhook(env.DISCORD_WEBHOOK_URL, 'Nothing Passed');
      } else {
        const { successCount, failureCount } = await notifyDiscordWithResults(env.DISCORD_WEBHOOK_URL, extendedResults);
        console.log(`Discord webhook results: ${successCount} succeeded, ${failureCount} failed`);
      }

      console.log(`trigger fired at ${event.cron}`);
    } catch (err) {
      console.error('Scheduled event failed:', err);
    }
  },
} satisfies ExportedHandler<Env>;
