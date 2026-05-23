import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendMailInput } from './type';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 587),
      secure: String(process.env.MAIL_SECURE).toLowerCase() === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection verified successfully',
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to verify SMTP connection',
      );
    }
  }

  async sendMail(input: SendMailInput) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to send email',
      );
    }
  }
}