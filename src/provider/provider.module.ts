import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { providerAdapterService } from './services/provider.adapter.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [
    providerAdapterService,
    {
      provide: 'IChannelManagerAdapter', // Token for Dependency Injection
      useClass: providerAdapterService,
    },
  ],
  exports: [providerAdapterService, 'IChannelManagerAdapter'],
})
export class providerModule {}