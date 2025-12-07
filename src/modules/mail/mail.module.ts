import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VendorModule } from '../vendor/vendor.module';
import { ImapService } from './imap.service';
import { MailService } from './mail.service';
import { RFPModule } from '../rfp/rfp.module';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { VendorProposalSchema } from 'src/schemas/proposal.schema';

@Module({
  imports: [
    forwardRef(() => RFPModule),
    forwardRef(() => VendorModule),
    MongooseModule.forFeature([
      { name: MONGO_MODEL_NAMES.PROPOSAL, schema: VendorProposalSchema },
    ]),
  ],
  providers: [MailService, ImapService],
  exports: [MailService, ImapService],
})
export class EmailModule {}
