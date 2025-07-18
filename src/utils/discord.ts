interface fields {
  name: string;
  value: string;
  inline?: boolean;
}

export const getDiscordWebhookBody = (fields: fields[]) => {
  return JSON.stringify({
    embeds: [
      {
        fields: fields,
      },
    ],
  });
};

export const getEmptyDiscordWebhookBody = (message: string) => {
  return JSON.stringify({
    content: message,
  });
};
