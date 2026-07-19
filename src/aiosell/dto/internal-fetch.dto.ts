// src/aiosell/dto/internal-fetch.dto.ts
import { IsString, Matches } from 'class-validator';

export class InternalFetchDto {
  @IsString()
  hotelId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  // This is OUR internal type. The service will map it to Aiosell's 'type' string.
  type!: 'inventory' | 'rates' | 'reservation';
}