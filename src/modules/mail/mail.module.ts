import { forwardRef, Module } from '@nestjs/common';

import { VendorModule } from '../vendor/vendor.module';
import { ImapService } from './imap.service';
import { MailService } from './mail.service';
import { RFPModule } from '../rfp/rfp.module';

@Module({
  imports: [forwardRef(() => RFPModule), forwardRef(() => VendorModule)],
  providers: [MailService, ImapService],
  exports: [MailService, ImapService],
})
export class EmailModule {}
