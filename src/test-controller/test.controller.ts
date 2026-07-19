import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AiosellAdapterService } from '../aiosell/services/aiosell-adapter.service';
import { InternalRatePushPayloadDto } from '../aiosell/dto/internal-rate.dto';
import { InternalInventoryPushDto } from 'src/aiosell/dto/internal-inventory.dto';
import { InternalInventoryRestrictionPushDto, InternalRateRestrictionPushDto } from 'src/aiosell/dto/internal-restrictions.dto';
import { InternalFetchDto } from 'src/aiosell/dto/internal-fetch.dto';
import { InternalNoShowDto } from 'src/aiosell/dto/internal-noshow.dto';

@Controller('test')
export class TestController {
    constructor(private readonly aiosellService: AiosellAdapterService) { }

    @Post('push-rates')
    @HttpCode(200)
    async testPushRates(@Body() payload: InternalRatePushPayloadDto) {
        // Notice: This payload is in YOUR internal format.
        // The service maps it to Aiosell automatically.
        return await this.aiosellService.pushRates(payload);
    }

    @Post('push-inventory')
    @HttpCode(200)
    async testInventory(@Body() payload: InternalInventoryPushDto) {
        return await this.aiosellService.pushInventory(payload);
    }

    @Post('push-inventory-restrictions')
    @HttpCode(200)
    async testInventoryRestrictions(@Body() payload: InternalInventoryRestrictionPushDto) {
        return await this.aiosellService.pushInventoryRestrictions(payload);
    }

    @Post('push-rate-restrictions')
    @HttpCode(200)
    async testRateRestrictions(@Body() payload: InternalRateRestrictionPushDto) {
        return await this.aiosellService.pushRateRestrictions(payload);
    }

    @Post('fetch-inventory')
    @HttpCode(200)
    async testFetchInventory(@Body() payload: InternalFetchDto) {
        return await this.aiosellService.fetchInventory(payload);
    }

    @Post('fetch-rates')
    @HttpCode(200)
    async testFetchRates(@Body() payload: InternalFetchDto) {
        return await this.aiosellService.fetchRates(payload);
    }

    @Post('fetch-reservations')
    @HttpCode(200)
    async testFetchReservations(@Body() payload: InternalFetchDto) {
        return await this.aiosellService.fetchReservations(payload);
    }

    @Post('push-noshow')
    @HttpCode(200)
    async testNoShow(@Body() payload: InternalNoShowDto) {
        return await this.aiosellService.pushNoShow(payload);
    }
}