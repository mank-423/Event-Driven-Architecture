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
import { InternalPropertyDetailsDto } from '../dto/internal-property-details';

@Injectable()
export class providerAdapterService implements IChannelManagerAdapter {
    private readonly baseUrl: string;
    private readonly partnerId: string;
    private readonly authHeader: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.baseUrl = this.configService.get<string>('BASE_URL')!;
        this.partnerId = this.configService.get<string>('PARTNER_ID')!;

        const username = this.configService.get<string>('USERNAME')!;
        const password = this.configService.get<string>('PASSWORD')!;
        this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }

    async pushRates(internalPayload: InternalRatePushPayloadDto): Promise<any> {
        // 1. 🔥 THE MAPPING LAYER (Key Renaming & Restructuring) 🔥
        // Since we have NoDB, we assume the Main PMS sent the correct ID values.
        // We just reshape the object to match provider's exact spec.
        const providerPayload = {
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
                this.httpService.post(url, providerPayload, {
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
            console.error('provider API call failed:', errorMsg);
            throw new InternalServerErrorException(`provider Error: ${errorMsg}`);
        }
    }

    async pushInventory(internalPayload: InternalInventoryPushDto): Promise<any> {
        // Map: hotelId → hotelCode, roomId → roomCode, available → available (same)
        const providerPayload = {
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
        return this.executePost('/update', providerPayload);
    }

    async pushInventoryRestrictions(payload: InternalInventoryRestrictionPushDto): Promise<any> {
        // Map: hotelId → hotelCode
        const providerPayload = {
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
        return this.executePost('/update', providerPayload);
    }

    async pushRateRestrictions(payload: InternalRateRestrictionPushDto): Promise<any> {
        const providerPayload = {
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
        return this.executePost('/update-rates', providerPayload);
    }

    // --- FETCH METHODS (The 'type' mapping) ---
    async fetchInventory(payload: InternalFetchDto): Promise<any> {
        // Map: hotelId → hotelCode, 'inventory' type
        const providerPayload = {
            type: 'inventory',
            hotelCode: payload.hotelId,
            startDate: payload.startDate,
            endDate: payload.endDate,
        };
        return this.executePost('/data', providerPayload);
    }

    async fetchRates(payload: InternalFetchDto): Promise<any> {
        const providerPayload = {
            type: 'rates',
            hotelCode: payload.hotelId,
            startDate: payload.startDate,
            endDate: payload.endDate,
        };
        return this.executePost('/data', providerPayload);
    }

    async fetchReservations(payload: InternalFetchDto): Promise<any> {
        const providerPayload = {
            type: 'reservation',
            hotelCode: payload.hotelId,
            startDate: payload.startDate,
            endDate: payload.endDate,
        };
        return this.executePost('/data', providerPayload);
    }

    async pushNoShow(payload: InternalNoShowDto): Promise<any> {
        // No-show API uses a different URL structure (no {pms} slug)
        const url = `${this.baseUrl}/noshow`;

        // The payload uses hotelId (not hotelCode) as per provider spec
        const providerPayload = {
            hotelId: payload.hotelId,
            bookingId: payload.bookingId,
            partner: payload.partner,
        };

        return this.executePostWithoutSlug('/noshow', providerPayload);
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
            throw new InternalServerErrorException(`provider Error: ${errorMsg}`);
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
            throw new InternalServerErrorException(`provider Error: ${errorMsg}`);
        }
    }

    async fetchPropertyDetails(payload: InternalPropertyDetailsDto): Promise<any> {
        const url = `${this.baseUrl}/property_details/${payload.hotelId}?partnerId=${payload.partnerId}`;

        try {
            const response = await firstValueFrom(
                this.httpService.get(url,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: this.authHeader,
                        },
                        timeout: 10000,
                    }
                )
            )

            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error('provider property details fetch failed:', errorMsg);
            throw new InternalServerErrorException(`provider Error: ${errorMsg}`);
        }
    }
}