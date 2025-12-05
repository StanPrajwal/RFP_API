import { Module } from '@nestjs/common';

import { VendorModule } from '../vendor/vendor.module';
import { ImapService } from './imap.service';
import { MailService } from './mail.service';

@Module({
  imports: [VendorModule],
  providers: [MailService, ImapService, VendorModule],
  exports: [MailService],
})
export class EmailModule {}
