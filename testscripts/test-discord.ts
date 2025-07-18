import { getEmptyDiscordWebhookBody } from '../src/utils/discord';

const sendWebhook = async () => {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: getEmptyDiscordWebhookBody('Nothing Passed'),
  });
};

sendWebhook();
