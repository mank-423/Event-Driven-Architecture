import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiosellAdapterService } from './services/aiosell-adapter.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [
    AiosellAdapterService,
    {
      provide: 'IChannelManagerAdapter', // Token for Dependency Injection
      useClass: AiosellAdapterService,
    },
  ],
  exports: [AiosellAdapterService, 'IChannelManagerAdapter'],
})
export class AiosellModule {}