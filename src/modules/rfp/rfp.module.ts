import { forwardRef, Module } from '@nestjs/common';
import { RFPController } from './rfp.controller';
import { RFPService } from './rfp.service';
import { OpenAiModule } from '../openai/openai.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { RFPSchema } from 'src/schemas/rfp.schema';
import { VendorModule } from '../vendor/vendor.module';

import { EmailModule } from '../mail/mail.module';
import { VendorProposalSchema } from 'src/schemas/proposal.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MONGO_MODEL_NAMES.RFP, schema: RFPSchema },
      { name: MONGO_MODEL_NAMES.PROPOSAL, schema: VendorProposalSchema },
    ]),
    OpenAiModule,
    forwardRef(() => VendorModule),
    forwardRef(() => EmailModule),
  ],
  controllers: [RFPController],
  providers: [RFPService],

  exports: [RFPService],
})
export class RFPModule {}
