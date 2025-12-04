import { Module } from '@nestjs/common';
import { AzureOpenAI } from 'openai';
import { OpenAiService } from './openai.service';

@Module({
  providers: [
    {
      provide: 'AZURE_OPENAI',
      useFactory: () => {
        return new AzureOpenAI({
          apiKey: process.env.AZURE_OPENAI_API_KEY,
          apiVersion: process.env.AZURE_OPENAI_API_VERSION,
          endpoint: process.env.AZURE_OPENAI_ENDPOINT,
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        });
      },
    },
    OpenAiService,
  ],

  exports: ['AZURE_OPENAI', OpenAiService],
})
export class OpenAiModule {}
