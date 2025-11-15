import { BollingerSignal, RSISignal } from '@/core/types/technicals';
import { formatBollingerSignal } from '@/utils/bollingerFormatter';
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
  bollingerSignal: BollingerSignal;
  rsiSignal?: RSISignal;
}

export async function notifyDiscordWithResults(webhookUrl: string, results: FullResult[]) {
  const discordFieldsList = results.map((result) => {
    const formatted = formatBollingerSignal(result.bollingerSignal);
    return [
      { name: result.bollingerSignal.symbol, value: result.bollingerSignal.type === 'SELL_CALL' ? 'Sell CALLS' : 'Sell PUTS' },
      { name: formatted.resultTitle, value: formatted.resultValue },
      { name: `RSI: ${result.rsiSignal?.rsi}`, value: result.rsiSignal?.status ?? '' },
      { name: formatted.optionsTableTitle, value: formatted.optionsTable },
    ];
  });

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
