import { Module } from '@nestjs/common';
import { RFPController } from './rfp.controller';
import { RFPService } from './rfp.service';
import { OpenAiModule } from '../openai/openai.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { RFPSchema } from 'src/schemas/rfp.schema';
import { VendorModule } from '../vendor/vendor.module';

import { EmailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MONGO_MODEL_NAMES.RFP, schema: RFPSchema },
    ]),
    OpenAiModule,
    VendorModule,
    EmailModule,
  ],
  providers: [RFPService],
  controllers: [RFPController],
})
export class RFPModule {}
