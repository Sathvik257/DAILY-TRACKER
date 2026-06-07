import nodemailer from 'nodemailer';
import { APP_NAME, SMTP_FROM } from './brand.js';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function createTransport() {
  if (!isEmailConfigured()) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendDailyReminderEmail(
  to: string,
  userName: string,
  pendingCount: number
): Promise<boolean> {
  const transport = createTransport();
  if (!transport) return false;

  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  const taskLine =
    pendingCount > 0
      ? `You have ${pendingCount} task${pendingCount > 1 ? 's' : ''} open today.`
      : 'Time to log your tasks and spending for today.';

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2C2825;">
      <h1 style="color: #2D5A4A; font-size: 22px; margin-bottom: 4px;">${APP_NAME}</h1>
      <p style="color: #7A7268; font-size: 13px; margin-top: 0;">Your personal daily check-in</p>
      <p style="font-size: 15px; line-height: 1.6;">${greeting}</p>
      <p style="font-size: 15px; line-height: 1.6;">${taskLine}</p>
      <p style="font-size: 14px; color: #7A7268;">Open the app to tick off tasks and track spending.</p>
      <hr style="border: none; border-top: 1px solid #EDE8E1; margin: 24px 0;" />
      <p style="font-size: 12px; color: #A39B90;">This message was sent by ${APP_NAME} because you turned on daily reminders.</p>
    </div>
  `;

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject: `${APP_NAME} — your daily check-in`,
    text: `${greeting}\n\n${taskLine}\n\n— ${APP_NAME}`,
    html,
  });

  return true;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const greeting = name ? `Hi ${name},` : 'Hi,';
  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject: `Welcome to ${APP_NAME}`,
    text: `${greeting}\n\nYour account is ready. Add your daily tasks once — they repeat every day.\n\n— ${APP_NAME}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2C2825;">
        <h1 style="color: #2D5A4A;">Welcome to ${APP_NAME}</h1>
        <p>${greeting}</p>
        <p>Your account is ready. Add your daily tasks once — they repeat every day.</p>
        <p style="font-size: 12px; color: #A39B90;">— ${APP_NAME}</p>
      </div>
    `,
  });
}
