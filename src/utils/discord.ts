interface fields {
  name: string;
  value: string;
}

export const getDiscordWebhookBody = (fields: fields[]) => {
  return {
    embeds: [
      {
        fields: fields,
      },
    ],
  };
};

export const getEmptyDiscordWebhookBody = (message: string) => {
  return {
    content: message,
  };
};
