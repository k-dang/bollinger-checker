import { BandCheckResult, RSIResult } from '@/core/types/technicals';
import { delay } from '@/utils/time';

interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

export const sendDiscordWebhook = async (webhookUrl: string, message: string) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: message,
    }),
  });

  return response;
};

const sendDiscordWebhookEmbeds = async (webhookUrl: string, fields: Field[]) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embeds: [
        {
          fields: fields,
        },
      ],
    }),
  });

  return response;
};

interface FullResult {
  bollingerResult: BandCheckResult;
  rsiResult?: RSIResult;
}

export async function notifyDiscordWithResults(webhookUrl: string, results: FullResult[]) {
  const discordFieldsList = results.map((result) => [
    { name: result.bollingerResult.symbol, value: result.bollingerResult.type === 'SELL_CALL' ? 'Sell CALLS' : 'Sell PUTS' },
    { name: result.bollingerResult.resultTitle, value: result.bollingerResult.resultValue },
    { name: `RSI: ${result.rsiResult?.rsi}`, value: result.rsiResult?.status ?? '' },
    { name: result.bollingerResult.optionsTableTitle, value: result.bollingerResult.optionsTable },
  ]);

  let successCount = 0;
  let failureCount = 0;
  for (const fields of discordFieldsList) {
    try {
      const response = await sendDiscordWebhookEmbeds(webhookUrl, fields);
      await delay(500);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      successCount++;
    } catch (err) {
      console.error('Discord webhook request failed:', err);
      failureCount++;
    }
  }
  return { successCount, failureCount };
}
