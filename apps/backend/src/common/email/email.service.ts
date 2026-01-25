import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.config.get<string>("SMTP_HOST");
    const port = Number(this.config.get<string>("SMTP_PORT") ?? 587);
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");

    if (!host || !user || !pass) {
      throw new InternalServerErrorException("SMTP configuration is missing");
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });

    return this.transporter;
  }

  async sendInviteEmail(params: {
    to: string;
    name: string;
    inviteUrl: string;
    expiresInHours: number;
  }) {
    const from =
      this.config.get<string>("SMTP_FROM") ??
      this.config.get<string>("SMTP_USER") ??
      "no-reply@ziqola.app";

    const transporter = this.getTransporter();
    const { to, name, inviteUrl, expiresInHours } = params;

    await transporter.sendMail({
      from,
      to,
      subject: "Undangan Akun Ziqola",
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a;">
          <h2>Halo ${name},</h2>
          <p>Anda telah diundang untuk bergabung ke Ziqola AMS.</p>
          <p>Silakan klik tombol di bawah ini untuk mengatur password dan mengaktifkan akun.</p>
          <p>
            <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Aktifkan Akun</a>
          </p>
          <p>Link ini berlaku selama ${expiresInHours} jam.</p>
          <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
        </div>
      `,
    });
  }
}
