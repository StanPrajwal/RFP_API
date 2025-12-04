import { Module } from '@nestjs/common';

import { ImapService } from './imap.service';
import { MailService } from './mail.service';

@Module({
  providers: [MailService, ImapService],
  exports: [MailService],
})
export class EmailModule {}
