import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI||'', {
      connectionFactory: (connection) => {
        console.log("MongoDB connected:", connection.name);
        return connection;
      }
    })
  ],
  exports: [MongooseModule]
})
export class DatabaseModule {}
