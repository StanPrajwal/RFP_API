import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

@Injectable()
export class ImapService implements OnModuleInit {
  private readonly logger = new Logger(ImapService.name);

  private readonly imap = new Imap({
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASS || '',
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT),
    tls: true,
  });

  onModuleInit() {
    this.start();
  }

  start() {
    this.imap.once('ready', () => this.openInbox());
    this.imap.once('error', (err) => {
      this.logger.error('IMAP connection error', err);
    });

    this.imap.connect();
  }

  private openInbox() {
    this.imap.openBox('INBOX', false, (err) => {
      if (err) throw err;

      this.logger.log('📥 IMAP connected — listening for vendor responses.');

      this.imap.on('mail', () => this.fetchNewEmails());
    });
  }

  private fetchNewEmails() {
    this.imap.search(['UNSEEN'], (err, results) => {
      if (err || !results?.length) return;

      const f = this.imap.fetch(results, { bodies: '' });

      f.on('message', (msg) => {
        msg.on('body', (stream) => {
          simpleParser(stream, async (err, parsed) => {
            if (err) {
              this.logger.error('Email parsing error', err);
              return;
            }

            const from = parsed.from?.text;
            const body = parsed.text;
            const attachments = parsed.attachments;

            this.logger.log(`📩 New vendor email from: ${from}`);

            // Send to AI parsing service
            // await this.aiService.parseVendorProposal({ from, body, attachments });

            this.logger.log('Vendor email processed successfully.');
          });
        });
      });
    });
  }
}
