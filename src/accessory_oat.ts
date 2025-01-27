import { PlatformAccessory } from 'homebridge';
import { CarrierInfinityHomebridgePlatform } from './platform';
import { AccessoryInformation, CharacteristicWrapper, MultiWrapper } from './base';
import { convertSystemTemp2CharTemp } from './helpers';

class OATSensorTemp extends CharacteristicWrapper {
  ctype = this.Characteristic.CurrentTemperature;
  get = async () => {
    return convertSystemTemp2CharTemp(
      await this.system.status.getOutdoorTemp(),
      await this.system.status.getUnits(),
    );
  };
}

export class OutdoorTempSensorService extends MultiWrapper {
  WRAPPERS = [OATSensorTemp];
}

export class OutdoorTemperatureAccessory {
  constructor(
    private readonly platform: CarrierInfinityHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    const system = this.platform.systems[this.accessory.context.serialNumber];
    new OutdoorTempSensorService(
      this.platform.api,
      system,
      this.accessory.context,
    ).wrap(
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor),
    );
  
    new AccessoryInformation(
      this.platform.api,
      system,
      this.accessory.context,
    ).wrap(
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation),
    );

  }
}