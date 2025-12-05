import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { VendorSchema } from 'src/schemas/vendor.schema';
import { OpenAiModule } from '../openai/openai.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

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
