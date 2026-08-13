import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, ValidateNested, Matches } from 'class-validator';

class InternalInventoryRoomDto {
  @IsString()
  roomId!: string;       // Main PMS sends "executive"

  @IsNumber()
  available!: number;    // e.g., 5
}

class InternalInventoryDateRangeDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalInventoryRoomDto)
  rooms!: InternalInventoryRoomDto[];
}

export class InternalInventoryPushDto {
  @IsString()
  hotelId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalInventoryDateRangeDto)
  updates!: InternalInventoryDateRangeDto[];
}