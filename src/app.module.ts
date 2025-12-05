import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { EmailModule } from './modules/mail/mail.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { RFPModule } from './modules/rfp/rfp.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RFPModule,
    OpenAiModule,
    VendorModule,
    EmailModule,
  ],

  providers: [],
})
export class AppModule {}
