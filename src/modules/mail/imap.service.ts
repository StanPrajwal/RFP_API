import { Injectable, Logger } from '@nestjs/common';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Cron } from '@nestjs/schedule';
import { VendorService } from '../vendor/vendor.service';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  constructor(private readonly vendorService: VendorService) {}

  private createImapConnection() {
    return new Imap({
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASS || '',
      host: process.env.IMAP_HOST,
      port: Number(process.env.IMAP_PORT),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });
  }

  // Can be trigger with Corn
  async fetchVendorEmails(): Promise<void> {
    this.logger.log('⏳ Checking for new vendor emails...');

    try {
      // 1️⃣ Load vendor emails dynamically
      const vendorResult = await this.vendorService.getAllVendors();
      const vendorEmails = vendorResult.data.map((v) => v.email.toLowerCase());

      const imap = this.createImapConnection();

      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err) => {
            if (err) {
              this.logger.error('Failed to open inbox', err);
              imap.end();
              return reject(err);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            imap.search(['UNSEEN', ['SINCE', today]], (err, results) => {
              if (err) {
                this.logger.error('IMAP search error', err);
                imap.end();
                return reject(err);
              }

              if (!results || results.length === 0) {
                this.logger.log('📭 No new unread emails.');
                imap.end();
                return resolve();
              }

              // 2️⃣ Limit to first 10 emails
              const limitedResults = results.slice(0, 50);
              this.logger.log(
                `Found ${results.length} unread emails → processing ${limitedResults.length}.`,
              );

              const fetcher = imap.fetch(limitedResults, {
                bodies: '',
                markSeen: true,
              });

              fetcher.on('message', (msg) => {
                msg.on('body', (stream) => {
                  simpleParser(stream, async (err, parsed) => {
                    if (err) {
                      this.logger.error('Email parsing error', err);
                      return;
                    }

                    const sender =
                      parsed.from?.value?.[0]?.address?.toLowerCase();
                    const subject = parsed.subject || '';
                    const body = parsed.text || parsed.html || '';
                    const attachments = parsed.attachments || [];
                    const rawResponse = {
                      rawEmail: stream,
                      headers: parsed.headers,
                      messageId: parsed.messageId,
                      date: parsed.date,
                      envelope: parsed.envelope,
                      parsed,
                    };

                    //  Skip non-vendors
                    if (!vendorEmails.includes(sender)) {
                      this.logger.warn(`Skipping non-vendor email: ${sender}`);
                      return;
                    }

                    //  Extract RFP-ID
                    const rfpIdMatch = subject.match(
                      /RFP-ID:\s*([a-fA-F0-9]{24})/,
                    );

                    if (!rfpIdMatch) {
                      this.logger.warn(
                        `Skipping vendor email (missing RFP-ID): ${subject}`,
                      );
                      return;
                    }

                    const rfpId = rfpIdMatch[1];

                    //  Find vendor record
                    const vendorDoc = vendorResult.data.find(
                      (v) => v.email.toLowerCase() === sender,
                    );

                    if (!vendorDoc) {
                      this.logger.warn(
                        `Vendor not found in DB for email: ${sender}`,
                      );
                      return;
                    }

                    const vendorId = vendorDoc._id;

                    this.logger.log(
                      `📩 Valid vendor reply from ${sender} for RFP ${rfpId}`,
                    );

                    // Save proposal DB entry
                    try {
                      await this.vendorService.saveVendorProposal({
                        sender,
                        subject,
                        body,
                        attachments,
                        rfpId,
                        vendorId,
                        rawResponse,
                      });

                      this.logger.log(
                        `💾 Vendor proposal saved successfully for vendor ${sender}`,
                      );
                    } catch (error) {
                      this.logger.error(
                        ` Failed to save vendor proposal: ${error.message}`,
                      );
                    }
                  });
                });
              });

              fetcher.once('end', () => {
                this.logger.log('📬 Email fetch cycle finished.');
                imap.end();
                resolve();
              });
            });
          });
        });

        imap.once('error', (err) => {
          this.logger.error('IMAP connection error', err);
          reject(err);
        });

        // Connect to IMAP server
        imap.connect();
      });
    } catch (error) {
      this.logger.error('Unexpected IMAP processing error', error);
      throw error;
    }
  }

  //CRON JOB Runs every 2 minutes
  @Cron('*/2 * * * *')
  async scheduledFetch() {
    this.logger.log('CRON: Checking vendor emails...');
    await this.fetchVendorEmails();
  }
}
