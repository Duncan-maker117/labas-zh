import { env } from "@labas/env/server";
import nodemailer from "nodemailer";
import { recordBounce } from "./bounce";
import { logger } from "@labas/api/logger";

const smtpPort = Number(env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: env.SMTP_USER && env.SMTP_PASS ? {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  } : undefined,
});

const subjects: Record<string, string> = {
  "email-verification": "DUNCAN 邮箱验证",
  "forget-password": "DUNCAN 重置密码",
};

const messages: Record<string, string> = {
  "email-verification": "请使用以下验证码验证你的邮箱：",
  "forget-password": "请使用以下验证码重置密码：",
};

type SendOtpEmailProps = {
  to: string;
  otp: string;
  type: "email-verification" | "forget-password";
};

export async function sendOtpEmail({ to, otp, type }: SendOtpEmailProps) {
  const subject = subjects[type] || "DUNCAN 验证码";
  const message = messages[type] || "你的验证码：";

  try {
    await transporter.sendMail({
      from: { name: "DUNCAN", address: env.SMTP_FROM.match(/<([^>]+)>/)?.[1] ?? env.SMTP_FROM },
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #14095b; border-bottom: 3px solid #00c9e5; padding-bottom: 12px;">DUNCAN</h2>
          <p>${message}</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">验证码有效期为 5 分钟，请勿向他人透露。</p>
        </div>
      `,
    });
  } catch (err) {
    const error = err as { responseCode?: number; code?: string; message?: string };
    if (error.responseCode && error.responseCode >= 400) {
      logger.warn("[SMTP] Rejection detected, recording bounce", {
        to,
        responseCode: error.responseCode,
        code: error.code,
      });
      await recordBounce(to, `SMTP ${error.responseCode}: ${error.message ?? error.code}`);
    }
    throw err;
  }
}
