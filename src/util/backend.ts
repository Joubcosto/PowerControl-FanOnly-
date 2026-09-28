import { APPLYTYPE, FAN_PWM_MODE, FANMODE } from "./enum";
import { FanControl } from "./pluginMain";
import { FanSetting, Settings, SettingsData } from "./settings";
import { FanPosition } from "./position";
import { JsonSerializer } from "typescript-json-serializer";
import { callable } from "@decky/api";
import { Logger } from "./logger";
import { FanConfig } from "../types";

const serializer = new JsonSerializer();

type InitCallable = () => Promise<(typeof BackendData.DEFAULTS)[keyof typeof BackendData.DEFAULTS]>;

interface InitConfigItem {
  callable: InitCallable;
}

// Proxy methods type definition
type ProxyMethods<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];
} & {
  [K in keyof T as `has${Capitalize<K & string>}`]: () => boolean;
};

// Backend API callable functions for fan control and general plugin support
export const getFanConfigList = callable<[], FanConfig[]>("get_fanConfigList");
export const getVersion = callable<[], string>("get_version");
export const getFanRPM = callable<[number], number>("get_fanRPM");
export const getFanTemp = callable<[number], number>("get_fanTemp");
export const getFanIsAuto = callable<[number], boolean>("get_fanIsAuto");
export const setFanAuto = callable<[number, boolean], void>("set_fanAuto");
export const setFanPercent = callable<[number, number], void>("set_fanPercent");
export const setFanCurve = callable<[number, number[], number[]], void>("set_fanCurve");
export const getLatestVersion = callable<[], string>("get_latest_version");
export const updateLatest = callable<[], any>("update_latest");
export const setSettings = callable<[any], void>("set_settings");
export const getSettings = callable<[], string>("get_settings");
export const logInfo = callable<[string], any>("log_info");
export const logError = callable<[string], any>("log_error");
export const logWarn = callable<[string], any>("log_warn");
export const logDebug = callable<[string], any>("log_debug");

export class BackendData {
  private data = new Map<string, any>();
  private loadedFlags = new Set<string>();
  private errors = new Map<string, Error>();

  private get<T>(key: string, defaultValue?: T): T {
    return this.data.get(key) ?? defaultValue;
  }

  private has(key: string): boolean {
    return this.loadedFlags.has(key);
  }

  private set<T>(key: string, value: T, error?: Error) {
    if (error) {
      this.errors.set(key, error);
      this.loadedFlags.delete(key);
      this.data.set(key, this.getDefaultValue(key));
    } else {
      this.data.set(key, value);
      this.loadedFlags.add(key);
      this.errors.delete(key);
    }
  }

  public static readonly DEFAULTS = {
    fanConfigs: [] as FanConfig[],
    currentVersion: "" as string,
    latestVersion: "" as string,
  } as const;

  private getDefaultValue(key: string) {
    return BackendData.DEFAULTS[key as keyof typeof BackendData.DEFAULTS];
  }

  private initConfig: { [K in keyof typeof BackendData.DEFAULTS]: InitConfigItem } = {
    fanConfigs: { callable: getFanConfigList },
    currentVersion: { callable: getVersion },
    latestVersion: { callable: getLatestVersion },
  };

  public async init() {
    const tasks = Object.entries(this.initConfig).map(([key, config]) =>
      this.initField(key, config)
    );
    await Promise.allSettled(tasks);
  }

  private async initField(key: string, config: InitConfigItem) {
    try {
      const result = await config.callable();
      this.set(key, result);
    } catch (error) {
      console.error(`初始化 ${key} 失败:`, error);
      logError(`初始化 ${key} 失败: ${error}`);
      this.set(key, this.getDefaultValue(key), error as Error);
    }
  }

  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        const propStr = prop.toString();

        if (propStr.startsWith("get") && propStr.length > 3) {
          const fieldName = propStr.slice(3);
          const actualFieldName =
            fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          if (actualFieldName in BackendData.DEFAULTS) {
            return () =>
              target.data.get(actualFieldName) ??
              BackendData.DEFAULTS[
                actualFieldName as keyof typeof BackendData.DEFAULTS
              ];
          }
        }

        if (propStr.startsWith("has") && propStr.length > 3) {
          const fieldName = propStr.slice(3);
          const actualFieldName =
            fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          if (actualFieldName in BackendData.DEFAULTS) {
            return () => target.loadedFlags.has(actualFieldName);
          }
        }

        return target[prop as keyof BackendData];
      },
    }) as this & ProxyMethods<typeof BackendData.DEFAULTS>;
  }

  public getFanMAXPRM(index: number) {
    const fanConfigs = this.get<any[]>("fanConfigs", []);
    if (this.has("fanConfigs")) {
      return fanConfigs?.[index]?.fan_max_rpm ?? 0;
    }
    return 0;
  }

  public getFanCount() {
    const fanConfigs = this.get<any[]>("fanConfigs", []);
    if (this.has("fanConfigs")) {
      return fanConfigs?.length ?? 0;
    }
    return 0;
  }

  public getFanName(index: number) {
    const fanConfigs = this.get<any[]>("fanConfigs", []);
    if (this.has("fanConfigs")) {
      return fanConfigs?.[index]?.fan_name ?? "Fan";
    }
    return "Fan";
  }

  public getFanConfigs() {
    if (this.has("fanConfigs")) {
      return this.get<any[]>("fanConfigs", []);
    }
    return [];
  }

  public getFanPwmMode(index: number) {
    const fanConfigs = this.get<any[]>("fanConfigs", []);
    if (this.has("fanConfigs")) {
      return fanConfigs?.[index]?.fan_hwmon_mode ?? 0;
    }
    return 0;
  }

  public getFanHwmonDefaultCurve(
    index: number
  ): { speedValue: number; tempValue: number }[] {
    const result: { speedValue: number; tempValue: number }[] = [];
    const fanConfigs = this.get<any[]>("fanConfigs", []);
    if (this.has("fanConfigs")) {
      const defaultCurve = fanConfigs?.[index]?.fan_default_curve ?? [];
      const pwmWriteMax: number =
        fanConfigs?.[index]?.fan_pwm_write_max ?? 255;
      if (defaultCurve instanceof Array && defaultCurve.length > 0) {
        for (let i = 0; i < defaultCurve.length; i++) {
          const pwmValue = defaultCurve[i]?.pwm_value;
          const tempValue = defaultCurve[i]?.temp_value;
          if (pwmValue !== undefined && tempValue !== undefined) {
            result.push({
              speedValue: Math.round((pwmValue / pwmWriteMax) * 100),
              tempValue,
            });
          }
        }
      }
    }
    return result;
  }

  public getDefaultFanSetting(index: number): FanSetting | undefined {
    const defaultFanPoints = this.getFanHwmonDefaultCurve(index);
    if (defaultFanPoints.length > 0) {
      const curvePoints: FanPosition[] = defaultFanPoints.map(
        (point) => new FanPosition(point.tempValue, point.speedValue)
      );
      return new FanSetting(false, FANMODE.CURVE, 50, curvePoints);
    }
    return undefined;
  }

  public async getFanRPM(index: number) {
    let fanRPM: number = 0;
    await getFanRPM(index)
      .then((res) => {
        fanRPM = res;
      })
      .catch((error) => {
        console.error("get_fanRPM error", error);
      });
    return fanRPM;
  }

  public async getFanTemp(index: number) {
    let fanTemp: number = -1;
    await getFanTemp(index)
      .then((res) => {
        fanTemp = res / 1000;
      })
      .catch((error) => {
        console.error("get_fanTemp error", error);
      });
    return fanTemp;
  }

  public async getFanIsAuto(index: number) {
    let fanIsAuto: boolean = false;
    await getFanIsAuto(index)
      .then((res) => {
        fanIsAuto = res;
      })
      .catch((error) => {
        console.error("get_fanIsAuto error", error);
      });
    return fanIsAuto;
  }
}

export class Backend {
  public static data: BackendData & ProxyMethods<typeof BackendData.DEFAULTS>;
  private static lastEnable: boolean = false;

  public static async init() {
    this.data = new BackendData() as BackendData &
      ProxyMethods<typeof BackendData.DEFAULTS>;
    await this.data.init();
    Backend.lastEnable = Settings.ensureEnable();
  }

  static {
    this.lastEnable = Settings.ensureEnable();
  }

  public static async applySettings(applyTarget: APPLYTYPE) {
    try {
      const currentEnable = Settings.ensureEnable();
      Logger.info(
        `applySettings: currentEnable = ${currentEnable}, lastEnable = ${Backend.lastEnable}`
      );
      if (!currentEnable) {
        if (currentEnable !== Backend.lastEnable) {
          Backend.resetSettings();
          Backend.lastEnable = currentEnable;
        }
        Logger.info(`Settings is disabled, skip applySettings`);
        return;
      }
      Backend.lastEnable = currentEnable;
      Logger.info(`>>>>>>>>>>>> applySettings ${applyTarget}`);

      await Backend.handleFanControl();
    } catch (error) {
      console.error(`应用设置失败: ${applyTarget}`, error);
    }
  }

  public static async handleFanControl(): Promise<void> {
    if (!FanControl.fanIsEnable) {
      return;
    }

    const fanSettings = Settings.appFanSettings();
    for (let index = 0; index < fanSettings.length; index++) {
      const fanSetting = Settings.appFanSettings()?.[index];
      if (!fanSetting) {
        await setFanAuto(index, true);
        continue;
      }

      const fanMode = fanSetting.fanMode;
      const fanRPMPercent = FanControl.fanInfo[index]?.setPoint?.fanRPMpercent;
      const fanWriteMode = Backend.data.getFanPwmMode(index);

      switch (fanMode) {
        case FANMODE.NOCONTROL:
          await setFanAuto(index, true);
          break;
        case FANMODE.FIX:
        case FANMODE.CURVE:
          if (fanWriteMode != FAN_PWM_MODE.MULTI_DIFF) {
            if (!fanRPMPercent) {
              console.error(`风扇转速百分比未设置: index=${index}`);
              continue;
            }
            await setFanPercent(index, fanRPMPercent);
            await setFanAuto(index, false);
          } else {
            console.log(`直接写入曲线数据`);
            await setFanCurve(
              index,
              fanSetting?.curvePoints?.map((point) => point?.temperature ?? 0) ?? [],
              fanSetting?.curvePoints?.map((point) => point?.fanRPMpercent ?? 0) ?? []
            );
          }
          break;
        default:
          console.error(`出现意外的FanMode = ${fanMode}`);
          await setFanAuto(index, true);
      }
    }
  }

  public static resetFanSettings = () => {
    FanControl.fanInfo.forEach((_value, index) => {
      setFanAuto(index, true);
    });
  };

  public static resetSettings = () => {
    console.log("重置所有设置");
    Backend.resetFanSettings();
  };

  // set_settings
  public static async setSettings(settingsData: SettingsData) {
    const obj = serializer.serializeObject(settingsData);
    await setSettings(obj);
  }

  // get_settings
  public static async getSettings(): Promise<SettingsData> {
    try {
      const res = (await getSettings()) as string;
      return (
        serializer.deserializeObject(res, SettingsData) ?? new SettingsData()
      );
    } catch (error) {
      console.error("getSettings error", error);
      return new SettingsData();
    }
  }
}