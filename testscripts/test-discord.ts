import { sendDiscordWebhook } from '../src/utils/discord';

await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_URL, 'Nothing Passed');
