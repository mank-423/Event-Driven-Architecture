import { Controller, Post, Body, HttpCode, Get, Query, HttpStatus } from '@nestjs/common';
import { providerAdapterService } from 'src/provider/services/provider.adapter.service';
import { InternalRatePushPayloadDto } from '../provider/dto/internal-rate.dto';
import { InternalInventoryPushDto } from 'src/provider/dto/internal-inventory.dto';
import { InternalInventoryRestrictionPushDto, InternalRateRestrictionPushDto } from 'src/provider/dto/internal-restrictions.dto';
import { InternalFetchDto } from 'src/provider/dto/internal-fetch.dto';
import { InternalNoShowDto } from 'src/provider/dto/internal-noshow.dto';
import { InternalPropertyDetailsDto } from 'src/provider/dto/internal-property-details';
import { RateLimiterService } from 'src/rate-limiter/rate-limiter.service';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      status: HttpStatus.OK,
      message: 'API is running!',
    };
  }
}

@Controller('api')
export class TestController {
    constructor(
        private readonly providerService: providerAdapterService,
        private readonly rateLimiter: RateLimiterService,
    ) { }

    @Post('push-rates')
    @HttpCode(200)
    async testPushRates(@Body() payload: InternalRatePushPayloadDto) {
        // Notice: This payload is in YOUR internal format.
        // The service maps it to provider automatically.
        return await this.providerService.pushRates(payload);
    }

    @Post('push-inventory')
    @HttpCode(200)
    async testInventory(@Body() payload: InternalInventoryPushDto) {
        return await this.providerService.pushInventory(payload);
    }

    @Post('push-inventory-restrictions')
    @HttpCode(200)
    async testInventoryRestrictions(@Body() payload: InternalInventoryRestrictionPushDto) {
        return await this.providerService.pushInventoryRestrictions(payload);
    }

    @Post('push-rate-restrictions')
    @HttpCode(200)
    async testRateRestrictions(@Body() payload: InternalRateRestrictionPushDto) {
        return await this.providerService.pushRateRestrictions(payload);
    }

    @Post('fetch-inventory')
    @HttpCode(200)
    async testFetchInventory(@Body() payload: InternalFetchDto) {
        return await this.providerService.fetchInventory(payload);
    }

    @Post('fetch-rates')
    @HttpCode(200)
    async testFetchRates(@Body() payload: InternalFetchDto) {
        return await this.providerService.fetchRates(payload);
    }

    @Post('fetch-reservations')
    @HttpCode(200)
    async testFetchReservations(@Body() payload: InternalFetchDto) {
        return await this.providerService.fetchReservations(payload);
    }

    @Post('push-noshow')
    @HttpCode(200)
    async testNoShow(@Body() payload: InternalNoShowDto) {
        return await this.providerService.pushNoShow(payload);
    }

    @Get('property-details')
    @HttpCode(200)
    async testFetchPropertyDetails(@Query() payload: InternalPropertyDetailsDto){
        return await this.providerService.fetchPropertyDetails(payload);
    }
}