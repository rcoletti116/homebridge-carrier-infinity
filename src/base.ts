import { ACTIVITY, InfinityEvolutionSystemModel } from './infinityApi';
import { API, Service, Characteristic } from 'homebridge';
import { CharacteristicValue, UnknownContext, WithUUID } from 'homebridge';

/*
* Helpers to add handlers to the HAP Service and Characteristic objects.
*/

class Wrapper {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  constructor(
    public readonly api: API,
    protected readonly system: InfinityEvolutionSystemModel,
    protected readonly context: UnknownContext,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  wrap(service: Service): void {
    return;
  }
}

export abstract class MultiWrapper extends Wrapper {
  protected WRAPPERS: typeof Wrapper[] = [];

  wrap(service: Service): void {
    for (const ctype of this.WRAPPERS) {
      new ctype(
        this.api,
        this.system,
        this.context,
      ).wrap(service);
    }
  }
}

export abstract class CharacteristicWrapper extends Wrapper {
  public abstract ctype: WithUUID<new () => Characteristic>;
  protected props = {};
  protected get: (() => Promise<CharacteristicValue>) | undefined;
  protected set: ((value: CharacteristicValue) => Promise<void>) | undefined;

  wrap(service: Service): void {
    const characteristic = service.getCharacteristic(this.ctype);
    if (this.props) {
      characteristic.setProps(this.props);
    }
    if (this.get) {
      characteristic.onGet(this.get.bind(this));
    }
    if (this.set) {
      characteristic.onSet(this.set.bind(this));
    }
  }
}

export abstract class ThermostatCharacteristicWrapper extends CharacteristicWrapper {
  // TODO: check in constructor that context has zone and hold settings

  async getActivity(): Promise<string> {
    // Vacation scheduling is weird, and changes infrequently. Just get it from status.
    if (await this.system.status.getZoneActivity(this.context.zone) === ACTIVITY.VACATION) {
      return ACTIVITY.VACATION;
    }
    // Config has more up to date activity settings.
    return await this.system.config.getZoneActivity(this.context.zone);
  }

  async getHoldTime(): Promise<string> {
    // OTMR setting to say when manual hold should end
    switch (this.context.holdBehavior) {
      case 'activity':
        return await this.system.config.getZoneNextActivityTime(this.context.zone);
      case 'for_x': {
        const arg = this.context.holdArgument.split(':');
        let target_ms = (new Date()).getTime();
        target_ms += Number(arg[0]) * 60 * 60 * 1000;
        target_ms += Number(arg[1]) * 60 * 1000;
        const target_date = new Date(target_ms);
        return `${target_date.getHours()}:${target_date.getMinutes()}`.padStart(5, '0');
      }
      case 'until_x':
        return this.context.holdArgument;
      case 'forever':
        return '';
      default:
        return '';
    }
  }
}

export class AccessoryInformation extends Wrapper {
  wrap(service: Service): void {
    this.system.profile.fetch().then(async () => {
      service
        .setCharacteristic(this.Characteristic.SerialNumber, this.system.serialNumber)
        .setCharacteristic(this.Characteristic.Manufacturer, `${await this.system.profile.getBrand()} Home`)
        .setCharacteristic(this.Characteristic.Model, await this.system.profile.getModel());
    });
  }
}