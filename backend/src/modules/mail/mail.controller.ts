
import { Body, Controller, Get, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
@Get('config')
getConfig() {
  return {
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE).toLowerCase() === 'true',
    user: process.env.MAIL_USER || '',
    from: process.env.MAIL_FROM || '',
    fromName: process.env.MAIL_FROM_NAME || 'ITJob System',
  };
}
  @Get('verify')
  async verifyConnection() {
    return this.mailService.verifyConnection();
  }

@Post('send-test')
async sendTestMail(@Body() body: { to?: string }) {
  const to = body?.to?.trim() || process.env.MAIL_USER?.trim();

  if (!to) {
    throw new Error('Recipient email is missing');
  }

  return this.mailService.sendMail({
    to,
    subject: 'Test email from ITJob system',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Test email</h2>
        <p>This is a test email from the ITJob backend mail service.</p>
        <p>If you received this email, SMTP is working correctly.</p>
      </div>
    `,
    text: 'This is a test email from the ITJob backend mail service.',
  });
}

}