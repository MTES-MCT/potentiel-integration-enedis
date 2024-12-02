import { getLogger } from "./logger.js";

const MAILJET_API_URL = "https://api.mailjet.com/v3.1/send";

type SendEmailNotificationsForAvailableFileProps = {
  username: string;
  password: string;
  templateId: number;
  recipients: string[];
};

export async function sendEmailNotificationsForAvailableFile({
  username,
  password,
  templateId,
  recipients,
}: SendEmailNotificationsForAvailableFileProps) {
  const body = {
    Messages: [
      {
        From: {
          Email: "team@potentiel.beta.gouv.fr",
          Name: "Team Potentiel",
        },
        To: recipients.map((email) => ({ Email: email })),
        TemplateID: templateId,
        TemplateLanguage: true,
      },
    ],
  };
  const response = await fetch(MAILJET_API_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
        "base64",
      )}`,
    },
  });
  if (!response.ok) {
    getLogger().warn("Error sending email", await response.json());
    return;
  }
  getLogger().info("email sent");
}
