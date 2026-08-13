import { InternalRatePushPayloadDto } from '../dto/internal-rate.dto';
import { InternalInventoryPushDto } from '../dto/internal-inventory.dto';
import { InternalInventoryRestrictionPushDto, InternalRateRestrictionPushDto } from '../dto/internal-restrictions.dto';
import { InternalFetchDto } from '../dto/internal-fetch.dto';
import { InternalPropertyDetailsDto } from '../dto/internal-property-details';

export interface IChannelManagerAdapter {
  // Pushes
  pushRates(payload: InternalRatePushPayloadDto): Promise<any>;
  pushInventory(payload: InternalInventoryPushDto): Promise<any>;
  pushInventoryRestrictions(payload: InternalInventoryRestrictionPushDto): Promise<any>;
  pushRateRestrictions(payload: InternalRateRestrictionPushDto): Promise<any>;
  
  // Fetches
  fetchInventory(payload: InternalFetchDto): Promise<any>;
  fetchRates(payload: InternalFetchDto): Promise<any>;
  fetchReservations(payload: InternalFetchDto): Promise<any>;

  // get property details
  fetchPropertyDetails(payload: InternalPropertyDetailsDto): Promise<any>;
}