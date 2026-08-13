import { IsString } from 'class-validator';

export class InternalPropertyDetailsDto {
    @IsString()
    hotelId!: string;

    @IsString()
    partnerId!: string;
}