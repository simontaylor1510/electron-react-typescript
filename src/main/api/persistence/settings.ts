import { writeFileSync, existsSync, readFileSync } from 'fs';
import * as powershell from 'node-powershell';

import { USER_DETAILS_PATH } from '../constants';
import { ApplicationLogger } from '../../utils/logger';
import { AppSettings } from '../../../renderer/types/appSettings';
import { UpdatedSettings } from '../../../renderer/types';

export class AppSettingsPersistence {
    private homePath: string;
    private userDataPath: string;
    private settingsPath: string;

    constructor(homePath: string, userDataPath: string) {
        this.homePath = homePath;
        this.userDataPath = userDataPath;
        this.settingsPath = `${this.userDataPath}\\aldd-settings.json`;
    }

    public loadAppSettings(): AppSettings {
        if (!existsSync(this.settingsPath)) {
            return {
                localNuGetPackageSourceFolder: `${this.homePath}\\.nuget\\AbstractionLayerSnapshot`,
                rootFolder: 'C:\\EJ',
                userDataFolder: this.userDataPath
            } as AppSettings;
        }

        try {
            const json = readFileSync(this.settingsPath, '') as string;
            const settings = JSON.parse(json) as AppSettings;
            if (settings.rootFolder) {
                settings.userDataFolder = this.userDataPath;
                return settings;
            }
        } catch (error) {
            ApplicationLogger.logError(`Failed to load from ${this.settingsPath}`, error);
        }

        return {
            localNuGetPackageSourceFolder: `${this.homePath}\\.nuget\AbstractionLayerSnapshot`,
            rootFolder: 'C:\\EJ',
            userDataFolder: this.userDataPath
        } as AppSettings;
    }

    public async saveAppSettings(appSettings: AppSettings): Promise<void> {
        ApplicationLogger.logInfo('Settings persisted to disk');
        writeFileSync(this.settingsPath, JSON.stringify(appSettings));
    }

    public async saveUserDetails(updatedSettings: UpdatedSettings): Promise<void> {
        const appSettings = this.loadAppSettings();

        if (updatedSettings.homeFolder !== null) {
            appSettings.rootFolder = updatedSettings.homeFolder;
            this.saveAppSettings(appSettings);
        }

        const ps = new powershell({
            debugMsg: false,
            noProfile: true
        } as powershell.ShellOptions);

        ps.addCommand(`. ${appSettings.rootFolder}${USER_DETAILS_PATH}`);
        ps.addCommand(`
        @"
\`$userDetails = @{
    apiKey = "$($userDetails.apiKey)";
    gitlabUsername = "$($userDetails.gitlabUsername)";
    gitlabPasswordSecure = "$($userDetails.gitlabPasswordSecure)";
    teamcityUsername = "$($userDetails.teamcityUsername)";
    teamcityPasswordSecure = "$($userDetails.teamcityPasswordSecure)";
    confluenceUsername = "$($userDetails.confluenceUsername)";
    confluencePasswordSecure = "$($userDetails.confluencePasswordSecure)";
    jiraUsername = "$($userDetails.jiraUsername)";
    jiraPasswordSecure = "$($userDetails.jiraPasswordSecure)";
    bjssEmail = "$($userDetails.bjssEmail)";
    settings = @{
        includeBehaviourRepositories = \`$$($userDetails.settings.includeBehaviourRepositories);
        includeContractRepositories = \`$$($userDetails.settings.includeContractRepositories);
        markMode = \`$$($userDetails.settings.markMode);
        useHttpRepositoryUrls = \`$$($userDetails.settings.useHttpRepositoryUrls)
    }
}
"@ | Out-File '${appSettings.rootFolder}${USER_DETAILS_PATH}'
`);

        try {
            await ps.invoke();
            ApplicationLogger.logInfo('Updated settings persisted to disk');
        } catch (error) {
            ApplicationLogger.logError(error, null);
        }
    }
}