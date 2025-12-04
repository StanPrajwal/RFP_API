import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { RFPModule } from './modules/rfp/rfp.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { VendorModule } from './modules/vendor/vendor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    DatabaseModule,
    RFPModule,
    OpenAiModule,
    VendorModule,
  ],

  providers: [],
})
export class AppModule {}
