import { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import axios from 'axios';

// import { ExamplePlatformAccessory } from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

// This is only required when using Custom Services and Characteristics not support by HomeKit
import { EveHomeKitTypes } from 'homebridge-lib/EveHomeKitTypes';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly discoveredCacheUUIDs: string[] = [];

  // This is only required when using Custom Services and Characteristics not support by HomeKit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomServices: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomCharacteristics: any;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    // This is only required when using Custom Services and Characteristics not support by HomeKit
    this.CustomServices = new EveHomeKitTypes(this.api).Services;
    this.CustomCharacteristics = new EveHomeKitTypes(this.api).Characteristics;

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.set(accessory.UUID, accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    
    // print the config
    const IP = this.config['IP Address'];
    const PORT = this.config['Port'];
    this.log.info('IP:', IP);
    this.log.info('PORT:', PORT);
    // const devices = [
    //   {
    //     id: 0,
    //     displayName: 'Temperature Sensor',
    //     type: this.api.hap.Service.TemperatureSensor,
    //   },
    //   {
    //     id: 1,
    //     displayName: 'Humidity Sensor',
    //     type: this.api.hap.Service.HumiditySensor,
    //   },
    //   {
    //     id: 2,
    //     displayName: 'Motion Sensor',
    //     type: this.api.hap.Service.MotionSensor,
    //   },
    //   {
    //     id: 3,
    //     displayName: 'Lightbulb',
    //     type: this.api.hap.Service.Lightbulb,
    //   },
    //   {
    //     id: 4,
    //     displayName: 'TV Power',
    //     type: this.api.hap.Service.Switch
    //   }
    // ];
    // send api request to get the devices

    let devices: { id: number; displayName: string; type: any }[] = [];
    try{
      const response = await axios.get(`http://${IP}:${PORT}/api_init`);
      devices = response.data;
    }
    catch (error) {
      this.log.error('Error:', error);
    }

    
    
    
    this.log.info('Devices:', devices);
    

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {
      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(String(device.id));

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.get(uuid);

      if (existingAccessory) {
        // the accessory already exists
        // this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. e.g.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        // new ExamplePlatformAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, e.g.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        
        // replace - and _ with space
        device.displayName = device.displayName.replace(/-/g, ' ');
        device.displayName = device.displayName.replace(/_/g, ' ');


        this.log.info('Adding new accessory:', device.displayName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.displayName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        // accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        // new ExamplePlatformAccessory(this, accessory); 
        if (device.type === "bulb") {
          device.type = this.api.hap.Service.Lightbulb;
        } else if (device.type === "temp_sensor") {
          device.type = this.api.hap.Service.TemperatureSensor;
        }
        else if (device.type === "humid_sensor") {
          device.type = this.api.hap.Service.HumiditySensor;
        }
        else if (device.type === "motion_sensor") {
          device.type = this.api.hap.Service.MotionSensor;
        }
        else if (device.type === "ir") {
          device.type = this.api.hap.Service.Switch;
        }

        const service = accessory.addService(device.type);
      
        if (device.type === this.api.hap.Service.Lightbulb) {
          service.getCharacteristic(this.api.hap.Characteristic.On)
            .onSet((value) => {
              this.log.info('Set Characteristic On ->', value);
              // api request to turn on/off the light
            })
            .onGet(() => {
              // api request to get the status of the light);
              return true;});
        } else if (device.type == this.api.hap.Service.TemperatureSensor) {
          service.getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
            .onGet(async () => {
              try {
                const response = await axios.post(`http://${IP}:${PORT}/api_post?id=${device.id}`);
                return response.data.temperature;
              }
              catch (error) {
                this.log.error('Error:', error);
                return 0;
              }
            });
        } else if (device.type == this.api.hap.Service.HumiditySensor) {
          service.getCharacteristic(this.api.hap.Characteristic.CurrentRelativeHumidity)
            .onGet(async () => {
              try {
                const response = await axios.post(`http://${IP}:${PORT}/api_post?id=${device.id}`);
                return response.data.humidity;
              }
              catch (error) {
                this.log.error('Error:', error);
                return 0;
              }
            });
        } else if (device.type == this.api.hap.Service.MotionSensor) {
          service.getCharacteristic(this.api.hap.Characteristic.MotionDetected)
            .onGet(async () => {
              try {
                const response = await axios.post(`http://${IP}:${PORT}/api_post?id=${device.id}`);
                return response.data.motion;
              }
              catch (error) {
                this.log.error('Error:', error);
                return false;
              }
            });
        } else if (device.type == this.api.hap.Service.Switch) {
          service.getCharacteristic(this.api.hap.Characteristic.On)
            .onGet(() => {
              // get the current state of the switch
              return true;
            })
            .onSet(async (value) => {
              try {
                const response = await axios.post(`http://${IP}:${PORT}/api_post?id=${device.id}`);
              }
              catch (error) {
                this.log.error('Error:', error);
              }
        });
        }

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }

      // push into discoveredCacheUUIDs
      this.discoveredCacheUUIDs.push(uuid);
    }

    // you can also deal with accessories from the cache which are no longer present by removing them from Homebridge
    // for example, if your plugin logs into a cloud account to retrieve a device list, and a user has previously removed a device
    // from this cloud account, then this device will no longer be present in the device list but will still be in the Homebridge cache
    for (const [uuid, accessory] of this.accessories) {
      if (!this.discoveredCacheUUIDs.includes(uuid)) {
        this.log.info('Removing existing accessory from cache:', accessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
