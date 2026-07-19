import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsArray, ValidateNested, IsOptional, Matches } from 'class-validator';

// Send null if not set, do not omit the key!
class InternalRestrictionDto {
  @IsOptional()
  @IsBoolean()
  stopSell?: boolean | null;

  @IsOptional()
  @IsNumber()
  minimumStay?: number | null;

  @IsOptional()
  @IsNumber()
  maximumStay?: number | null;

  @IsOptional()
  @IsBoolean()
  closeOnArrival?: boolean | null;

  @IsOptional()
  @IsBoolean()
  closeOnDeparture?: boolean | null;

  @IsOptional()
  @IsNumber()
  minimumStayArrival?: number | null;

  @IsOptional()
  @IsNumber()
  maximumStayArrival?: number | null;

  @IsOptional()
  @IsNumber()
  exactStayArrival?: number | null;

  @IsOptional()
  @IsNumber()
  minimumAdvanceReservation?: number | null;

  @IsOptional()
  @IsNumber()
  maximumAdvanceReservation?: number | null;
}

// For Inventory Restrictions (Room level)
class InternalInventoryRestrictionRoomDto {
  @IsString()
  roomId!: string;

  @ValidateNested()
  @Type(() => InternalRestrictionDto)
  restrictions!: InternalRestrictionDto;
}

class InternalInventoryRestrictionDateRangeDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalInventoryRestrictionRoomDto)
  rooms!: InternalInventoryRestrictionRoomDto[];
}

export class InternalInventoryRestrictionPushDto {
  @IsString()
  hotelId!: string;

  @IsArray()
  @IsString({ each: true })
  toChannels!: string[]; // e.g., ["agoda", "booking.com"]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalInventoryRestrictionDateRangeDto)
  updates!: InternalInventoryRestrictionDateRangeDto[];
}

// For Rate Restrictions (RatePlan level)
class InternalRateRestrictionRateDto {
  @IsString()
  roomId!: string;

  @IsString()
  ratePlanId!: string;

  @ValidateNested()
  @Type(() => InternalRestrictionDto)
  restrictions!: InternalRestrictionDto;
}

class InternalRateRestrictionDateRangeDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalRateRestrictionRateDto)
  rates!: InternalRateRestrictionRateDto[];
}

export class InternalRateRestrictionPushDto {
  @IsString()
  hotelId!: string;

  @IsArray()
  @IsString({ each: true })
  toChannels!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalRateRestrictionDateRangeDto)
  updates!: InternalRateRestrictionDateRangeDto[];
}