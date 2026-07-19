import { IsString } from 'class-validator';

export class InternalNoShowDto {
  @IsString()
  hotelId!: string;

  @IsString()
  bookingId!: string;

  @IsString()
  partner!: string; // Currently supports: "booking.com", "gommt"
}