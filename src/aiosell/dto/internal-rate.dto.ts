import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, ValidateNested, Matches } from 'class-validator';

// Internal Rate object
export class InternalRateDto {
    @IsString()
    roomId!: string;

    @IsString()
    ratePlanId!: string;

    @IsNumber()
    price!: number;
}

// Internal Date Range object
export class InternalDateRangeDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD' })
  startDate!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD' })
  endDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalRateDto)
  rates!: InternalRateDto[];
}

export class InternalRatePushPayloadDto {
  @IsString()
  hotelId!: string;       // The PMS knows this is "sandbox-pms" 

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalDateRangeDto)
  updates!: InternalDateRangeDto[];
}