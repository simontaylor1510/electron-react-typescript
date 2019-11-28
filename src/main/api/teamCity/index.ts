import { BuildsActionsEnum } from '../../../renderer/actions/buildEnums';
import { TeamCityBuilds } from './builds';
import { ApplicationLogger } from '../../utils/logger';
import { UserSettings } from '../userSettings';
import { UserCredentials } from '../../../renderer/types/userCredentials';
import { SettingsActionsEnum } from '../../../renderer/actions';
import { TeamCityApiClient } from './shared';

export class TeamCityFunctions {
    private teamCityApiClient: TeamCityApiClient;
    private teamCityBuilds: TeamCityBuilds;
    private apiMethods: Map<string, (payload?: any) => Promise<[string, any]>>;
    private responseSender: (responseName: string, payload: any) => void;

    constructor(
        responseSender: (responseName: string, payload: any) => void,
        userSettings: UserSettings,
        apiMethods: Map<string, (payload?: any) => Promise<[string, any]>>) {

        this.teamCityApiClient = new TeamCityApiClient();
        this.teamCityBuilds = new TeamCityBuilds(this.teamCityApiClient);
        this.apiMethods = apiMethods;
        this.responseSender = responseSender;

        this.teamCityBuilds.listenForBuildEvents(this.responseSender);

        this.teamCityBuilds.on('disconnected', () => {
            ApplicationLogger.logInfo('Lost connection to TeamCity notification emails');
            //this.responseSender('xxx', undefined);
        });

        apiMethods.set(BuildsActionsEnum.RequestFailedBuilds, async (): Promise<[string, any]> => {
            try {
                const failedBuilds = await this.teamCityBuilds.getFailedBuilds(userSettings.teamcityApiKey);
                return [BuildsActionsEnum.FailedBuildsResult, failedBuilds];
            } catch (error) {
                ApplicationLogger.logError(`error in getFailedBuilds`, error);
                return [BuildsActionsEnum.RequestFailedBuildsError, error];
            }
        });

        apiMethods.set(SettingsActionsEnum.VerifyTeamCityCredentials, async (payload: UserCredentials): Promise<[string, any]> => {
            try {
                const testTeamcityApiKey = Buffer.from(`${payload.username}:${payload.password}`).toString('base64');
                await this.teamCityBuilds.getFailedBuilds(testTeamcityApiKey);
                return [SettingsActionsEnum.VerifyTeamCityCredentialsResult, { success: true, invalidCredentials: false, failureReason: null }];
            } catch (error) {
                this.teamCityApiClient.resetErrors();
                ApplicationLogger.logError(`error in getFailedBuilds`, error);
                return [
                    SettingsActionsEnum.VerifyTeamCityCredentialsResult,
                    { success: false, failureReason: error.message, invalidCredentials: error.message.startsWith('Status code 401') }
                ];
            }
        });

        apiMethods.set(BuildsActionsEnum.ResetUnseenCount, async (): Promise<[string, any]> => {
            this.teamCityBuilds.resetUnseenFailedBuildCount();
            return [BuildsActionsEnum.UnseenCountUpdated, 0];
        });
    }

    public terminate(): void {
        this.apiMethods.delete(BuildsActionsEnum.RequestFailedBuilds);
        this.apiMethods.delete(SettingsActionsEnum.VerifyTeamCityCredentials);
        this.apiMethods.delete(BuildsActionsEnum.ResetUnseenCount);
    }
}
