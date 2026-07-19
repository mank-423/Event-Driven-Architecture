import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IChannelManagerAdapter } from '../interfaces/channel-manager.interface';
import { InternalRatePushPayloadDto } from '../dto/internal-rate.dto';
import { InternalInventoryRestrictionPushDto, InternalRateRestrictionPushDto } from '../dto/internal-restrictions.dto';
import { InternalFetchDto } from '../dto/internal-fetch.dto';
import { InternalInventoryPushDto } from '../dto/internal-inventory.dto';
import { InternalNoShowDto } from '../dto/internal-noshow.dto';

@Injectable()
export class AiosellAdapterService implements IChannelManagerAdapter {
    private readonly baseUrl: string;
    private readonly partnerId: string;
    private readonly authHeader: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.baseUrl = this.configService.get<string>('AIOSELL_BASE_URL')!;
        this.partnerId = this.configService.get<string>('AIOSELL_PARTNER_ID')!;

        const username = this.configService.get<string>('AIOSELL_USERNAME')!;
        const password = this.configService.get<string>('AIOSELL_PASSWORD')!;
        this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }

    async pushRates(internalPayload: InternalRatePushPayloadDto): Promise<any> {
        // 1. 🔥 THE MAPPING LAYER (Key Renaming & Restructuring) 🔥
        // Since we have NoDB, we assume the Main PMS sent the correct ID values.
        // We just reshape the object to match Aiosell's exact spec.
        const aiosellPayload = {
            hotelCode: internalPayload.hotelId, // hotelId → hotelCode
            updates: internalPayload.updates.map((dateRange) => ({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                rates: dateRange.rates.map((rate) => ({
                    roomCode: rate.roomId,           // roomId → roomCode
                    rateplanCode: rate.ratePlanId,   // ratePlanId → rateplanCode (notice camelCase)
                    rate: rate.price,                // price → rate
                })),
            })),
        };

        // 2. Construct the URL (Uses the {pms} slug from .env)
        const url = `${this.baseUrl}/update-rates/${this.partnerId}`;

        try {
            const response = await firstValueFrom(
                this.httpService.post(url, aiosellPayload, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: this.authHeader,
                    },
                    timeout: 10000,
                }),
            );

            if (response.data.success === true) {
                return response.data;
            } else {
                throw new InternalServerErrorException(response.data.message);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error('Aiosell API call failed:', errorMsg);
            throw new InternalServerErrorException(`Aiosell Error: ${errorMsg}`);
        }
    }

    async pushInventory(internalPayload: InternalInventoryPushDto): Promise<any> {
        // Map: hotelId → hotelCode, roomId → roomCode, available → available (same)
        const aiosellPayload = {
            hotelCode: internalPayload.hotelId,
            updates: internalPayload.updates.map((dateRange) => ({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                rooms: dateRange.rooms.map((room) => ({
                    roomCode: room.roomId,
                    available: room.available,
                })),
            })),
        };
        return this.executePost('/update', aiosellPayload);
    }

    async pushInventoryRestrictions(payload: InternalInventoryRestrictionPushDto): Promise<any> {
        // Map: hotelId → hotelCode
        const aiosellPayload = {
            hotelCode: payload.hotelId,
            toChannels: payload.toChannels,
            updates: payload.updates.map((dateRange) => ({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                rooms: dateRange.rooms.map((room) => ({
                    roomCode: room.roomId,
                    restrictions: room.restrictions, // Direct pass-through (internal matches vendor)
                })),
            })),
        };
        return this.executePost('/update', aiosellPayload);
    }

    async pushRateRestrictions(payload: InternalRateRestrictionPushDto): Promise<any> {
        const aiosellPayload = {
            hotelCode: payload.hotelId,
            toChannels: payload.toChannels,
            updates: payload.updates.map((dateRange) => ({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                rates: dateRange.rates.map((rate) => ({
                    roomCode: rate.roomId,
                    rateplanCode: rate.ratePlanId,
                    restrictions: rate.restrictions,
                })),
            })),
        };
        return this.executePost('/update-rates', aiosellPayload);
    }

    // --- FETCH METHODS (The 'type' mapping) ---
    async fetchInventory(payload: InternalFetchDto): Promise<any> {
        // Map: hotelId → hotelCode, 'inventory' type
        const aiosellPayload = {
            type: 'inventory',
            hotelCode: payload.hotelId,
            startDate: payload.startDate,
            endDate: payload.endDate,
        };
        return this.executePost('/data', aiosellPayload);
    }

    async fetchRates(payload: InternalFetchDto): Promise<any> {
        const aiosellPayload = {
            type: 'rates',
            hotelCode: payload.hotelId,
            startDate: payload.startDate,
            endDate: payload.endDate,
        };
        return this.executePost('/data', aiosellPayload);
    }

    async fetchReservations(payload: InternalFetchDto): Promise<any> {
        const aiosellPayload = {
            type: 'reservation',
            hotelCode: payload.hotelId,
            startDate: payload.startDate,
            endDate: payload.endDate,
        };
        return this.executePost('/data', aiosellPayload);
    }

    async pushNoShow(payload: InternalNoShowDto): Promise<any> {
        // No-show API uses a different URL structure (no {pms} slug)
        const url = `${this.baseUrl}/noshow`;

        // The payload uses hotelId (not hotelCode) as per Aiosell spec
        const aiosellPayload = {
            hotelId: payload.hotelId,
            bookingId: payload.bookingId,
            partner: payload.partner,
        };

        return this.executePostWithoutSlug('/noshow', aiosellPayload);
    }

    private async executePostWithoutSlug(endpoint: string, payload: any): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;
        try {
            const response = await firstValueFrom(
                this.httpService.post(url, payload, {
                    headers: { 'Content-Type': 'application/json', Authorization: this.authHeader },
                    timeout: 10000,
                }),
            );
            if (response.data.success) return response.data;
            throw new InternalServerErrorException(response.data.message);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            throw new InternalServerErrorException(`Aiosell Error: ${errorMsg}`);
        }
    }

    // --- PRIVATE HELPER to avoid code duplication (DRY) ---
    private async executePost(endpoint: string, payload: any): Promise<any> {
        const url = `${this.baseUrl}${endpoint}/${this.partnerId}`;
        try {
            const response = await firstValueFrom(
                this.httpService.post(url, payload, {
                    headers: { 'Content-Type': 'application/json', Authorization: this.authHeader },
                    timeout: 10000,
                }),
            );
            if (response.data.success) return response.data;
            throw new InternalServerErrorException(response.data.message);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            throw new InternalServerErrorException(`Aiosell Error: ${errorMsg}`);
        }
    }
}