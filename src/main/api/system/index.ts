import { ApplicationActionsEnum } from '../../../renderer/actions/applicationEnums';
import { SystemEvents } from './systemEvents';
import { SettingsActionsEnum } from '../../../renderer/actions/settingsEnums';
import { selectFolder } from './folders';
import { UpdatedSettings } from '../../../renderer/types';
import { AppSettingsPersistence } from '../persistence/settings';

export class SystemFunctions {
    private responseSender: (responseName: string, payload: any) => void;
    private systemEvents: SystemEvents;
    private appSettingsPersistence: AppSettingsPersistence;

    constructor(
        appSettingsPersistence: AppSettingsPersistence,
        responseSender: (responseName: string, payload: any) => void,
        apiMethods: Map<string, (payload?: any) => Promise<[string, any]>>) {

        this.appSettingsPersistence = appSettingsPersistence;
        this.responseSender = responseSender;
        this.systemEvents = new SystemEvents(this.responseSender);

        apiMethods.set(ApplicationActionsEnum.MonitorDeviceLockEvents, (): Promise<[string, any]> => {
            this.systemEvents.monitorDeviceLockEvents();
            return new Promise(resolve => resolve(['', {}]));
        });

        apiMethods.set(SettingsActionsEnum.SelectFolder, (payload?: any): Promise<[string, any]> => {
            const selectedFolder = selectFolder(payload);
            return new Promise(resolve => resolve([SettingsActionsEnum.SelectedFolder,
                { location: selectedFolder, cancelled: selectedFolder === null }]));
        });

        apiMethods.set(SettingsActionsEnum.SaveUpdatedSettings, (payload: UpdatedSettings): Promise<[string, any]> => {
            this.appSettingsPersistence.saveUserDetails(payload);
            return new Promise(resolve => resolve([SettingsActionsEnum.SaveUpdatedSettings, true]));
        });
    }
}
