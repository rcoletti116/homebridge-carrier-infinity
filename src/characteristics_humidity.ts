import { CharacteristicWrapper, MultiWrapper, ThermostatCharacteristicWrapper } from './base';

class CurrentRH extends CharacteristicWrapper {
  ctype = this.Characteristic.CurrentRelativeHumidity;
  get = async () => {
    return await this.system.status.getZoneHumidity(this.context.zone);
  };
}

class TargetDehumidify extends ThermostatCharacteristicWrapper {
  ctype = this.Characteristic.RelativeHumidityDehumidifierThreshold;
  get = async () => {
    return await this.system.config.getHumidityActvityCoolTarget(
      await this.getActivity(),
    );
  };
}

class TargetHumidify extends ThermostatCharacteristicWrapper {
  ctype = this.Characteristic.RelativeHumidityHumidifierThreshold;
  get = async () => {
    return await this.system.config.getHumidityActvityHeatTarget(
      await this.getActivity(),
    );
  };
}


export class ThermostatRHService extends MultiWrapper {
  WRAPPERS = [
    CurrentRH,
  ];
}

export class HumidifierService extends MultiWrapper {
    WRAPPERS = [
      CurrentRH,
      TargetDehumidify,
      TargetHumidify,
    ];
}