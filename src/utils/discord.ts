import { BandCheckResult } from '../bollingerChecker';
import { delay } from './time';

export interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

const buildDiscordWebhookEmbeds = (fields: Field[]) => {
  return JSON.stringify({
    embeds: [
      {
        fields: fields,
      },
    ],
  });
};

const buildDiscordWebhookContent = (message: string) => {
  return JSON.stringify({
    content: message,
  });
};

export const sendDiscordWebhook = async (webhookUrl: string, message: string) => {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: buildDiscordWebhookContent(message),
  });
};

export const sendDiscordWebhookEmbeds = async (webhookUrl: string, fields: Field[]) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: buildDiscordWebhookEmbeds(fields),
  });

  return response;
};

export async function notifyDiscordWithResults(webhookUrl: string, results: BandCheckResult[]) {
  const discordFieldsList = results.map((result) => [
    { name: result.symbol, value: result.type === 'SELL_CALL' ? 'Sell CALLS' : 'Sell PUTS' },
    { name: result.result, value: result.resultValue },
    { name: result.optionsTableTitle, value: result.optionsTable },
  ]);
  let successCount = 0;
  let failureCount = 0;
  for (const fields of discordFieldsList) {
    try {
      const response = await sendDiscordWebhookEmbeds(webhookUrl, fields);
      await delay(250);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      successCount++;
    } catch (err) {
      console.error('Discord webhook request failed:', err);
      failureCount++;
    }
  }
  return { successCount, failureCount };
}
