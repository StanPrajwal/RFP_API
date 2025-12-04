import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || '', {
      connectionFactory: (connection) => {
        console.log('MongoDB connected:', connection.name);
        return connection;
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
