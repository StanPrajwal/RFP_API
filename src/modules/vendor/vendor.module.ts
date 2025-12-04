import { Module } from '@nestjs/common';

import { OpenAiModule } from '../openai/openai.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { RFPSchema } from 'src/schemas/rfp.schema';
import { VendorService } from './vendor.service';
import { VendorSchema } from 'src/schemas/vendor.schema';
import { VendorController } from './vendor.controller';

@Module({
  controllers: [VendorController],
  imports: [
    MongooseModule.forFeature([
      { name: MONGO_MODEL_NAMES.VENDOR, schema: VendorSchema },
    ]),
    OpenAiModule,
  ],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
