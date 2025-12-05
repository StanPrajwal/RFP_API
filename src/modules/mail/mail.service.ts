import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private compileTemplate(templateName: string, context: any) {
    const filePath = path.join(
      process.cwd(),
      'src/modules/mail/templates',
      `${templateName}.html`,
    );
    const templateStr = fs.readFileSync(filePath, 'utf-8');
    const template = handlebars.compile(templateStr);

    const plainContext = JSON.parse(JSON.stringify(context));

    return template(plainContext);
  }

  async sendRfpEmail(to: string, payload: any) {
    const html = this.compileTemplate('rfp-mail', payload);

    try {
      await this.transporter.sendMail({
        from: `"Procurement System" <${process.env.EMAIL_USER}>`,
        to,
        subject: `RFP Invitation - ${payload.title} | RFP-ID: ${payload.rfpId}`,
        html,
      });

      this.logger.log(`RFP email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw error;
    }
  }
}
