interface fields {
  name: string;
  value: string;
  inline?: boolean;
}

const buildDiscordWebhookEmbeds = (fields: fields[]) => {
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

export const sendDiscordWebhookEmbeds = async (webhookUrl: string, fields: fields[]) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: buildDiscordWebhookEmbeds(fields),
  });

  return response;
};
