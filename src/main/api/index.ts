import { app, ipcMain, IpcMainEvent } from 'electron';
import * as powershell from 'node-powershell';

import { USER_DETAILS_PATH } from './constants';
import { TeamCityFunctions } from './teamCity';
import { GitLabFunctions } from './gitlab';
import { GitFunctions } from './git';
import { SystemFunctions } from './system';
import { ApplicationLogger } from '../utils/logger';
import { LocalProjectsPersistence } from './persistence/localProjects';
import { ServerProjectsPersistence } from './persistence/gitlabProjects';
import { ProjectsActionsEnum } from '../../renderer/actions/projectEnums';
import { IpcPayload } from '../../renderer/types';
import { LocalProjectStatusResult } from '../../renderer/types/localProjectStatus';
import { UserSettings } from './userSettings';
import { ApplicationActionsEnum, BuildsActionsEnum, SettingsActionsEnum } from '../../renderer/actions';
import { AppSettings } from '../../renderer/types/appSettings';
import { AppSettingsPersistence } from './persistence/settings';
// import { NuGetPackageSourceFunctions } from './localNuGetPackageSource';

export class Server {
    private apiMethods = new Map<string, (payload: any) => Promise<[string, any]>>();

    private appSettingsPersistence: AppSettingsPersistence;

    private localProjectsPersistence: LocalProjectsPersistence;

    private serverProjectsPersistence: ServerProjectsPersistence;

    // @ts-ignore
    private systemFunctions: SystemFunctions | undefined;

    // @ts-ignore
    private teamCityFunctions: TeamCityFunctions | undefined;

    private gitLabFunctions: GitLabFunctions | undefined;

    private gitFunctions: GitFunctions | undefined;

    // private nuGetPackageSourceFunctions: NuGetPackageSourceFunctions | undefined;

    private reactClient: Electron.WebContents;

    private appSettings = {
        apiToken: '7agh34lhkaf431',
        gitlabUsername: 'firstname.lastname',
        rootFolder: 'C:\\EJ',
        teamCityUsername: 'firstname.lastname'
    } as AppSettings;

    private userSettings = {} as UserSettings;

    private userDataFolder: string = app.getPath('userData');
    private homeFolder: string = app.getPath('home');

    private isOnline: boolean = true;

    constructor(client: Electron.WebContents) {
        this.reactClient = client;

        this.appSettingsPersistence = new AppSettingsPersistence(this.homeFolder, this.userDataFolder);
        this.appSettings = this.appSettingsPersistence.loadAppSettings();

        this.localProjectsPersistence = new LocalProjectsPersistence(this.userDataFolder);
        this.serverProjectsPersistence = new ServerProjectsPersistence(this.userDataFolder);

        this.systemFunctions = new SystemFunctions(this.appSettingsPersistence, this.sharedSendAndLogResponse, this.apiMethods);

        // this.nuGetPackageSourceFunctions = new NuGetPackageSourceFunctions(
        //     this.appSettings,
        //     this.sharedSendAndLogResponse,
        //     this.apiMethods);

        ipcMain.on('nodeApi', async (_: any, payload: IpcPayload) => {
            await this.nodeApiListener(_, payload);
        });

        ipcMain.on('online-status-changed', (_: IpcMainEvent, status: string) => {
            if (status === 'online' && !this.isOnline) {
                this.isOnline = true;
                ApplicationLogger.logInfo('Internet connectivity resumed');
                this.goOnline();
                this.performStartupActions([ProjectsActionsEnum.RequestAllProjects, BuildsActionsEnum.RequestFailedBuilds]);
            } else if (this.isOnline) {
                this.isOnline = false;
                ApplicationLogger.logInfo('Internet connectivity lost');
                this.goOffline();
            }
        });
    }

    public async inititialiseAsync(isOnline: boolean): Promise<void> {
        await this.getSecretKeys();
        const homeFolder = app.getPath('home').replace('\\', '/');
        this.gitFunctions = new GitFunctions(
            this.appSettings,
            this.userSettings,
            this.sharedSendAndLogResponse,
            this.apiMethods,
            homeFolder,
            this.userDataFolder,
            this.localProjectsPersistence);

        this.reactClient.send(ApplicationActionsEnum.ElectronReady, null);
        this.reactClient.send(SettingsActionsEnum.SettingsLoaded, this.appSettings);

        this.performStartupActions([ProjectsActionsEnum.RequestAllLocalProjects]);

        if (isOnline) {
            this.goOnline();
        }
    }

    public terminate(): void {
        ApplicationLogger.logInfo('Terminating ...');
    }

    private sharedSendAndLogResponse = (responseName: string, responsePayload: any) => this.sendAndLogResponse(responseName, responsePayload);

    private performStartupActions(actions: string[]) {
        actions.forEach(async actionName => {
            const method = this.apiMethods.get(actionName);
            if (method) {
                let retriesAvailable = 3;
                let done = false;

                while (!done) {
                    try {
                        const response = await method(undefined);
                        this.sendAndLogResponse(response[0], response[1]);
                        done = true;
                    } catch (error) {
                        retriesAvailable--;
                        ApplicationLogger.logError(`Call to ${actionName} FAILED, ${(retriesAvailable > 0 ? 'RETRYING' : 'ABORTED!')}`, error);
                        if (retriesAvailable === 0) {
                            done = true;
                        }
                    }
                }
            }
        });
    }

    private goOffline(): void {
        if (this.gitLabFunctions) {
            this.gitLabFunctions.terminate();
            this.gitLabFunctions = undefined;
        }
        if (this.teamCityFunctions) {
            this.teamCityFunctions.terminate();
            this.teamCityFunctions = undefined;
        }
    }

    private goOnline(): void {
        this.gitLabFunctions = new GitLabFunctions(this.userSettings, this.sharedSendAndLogResponse, this.apiMethods, this.serverProjectsPersistence);
        this.teamCityFunctions = new TeamCityFunctions(this.sharedSendAndLogResponse, this.userSettings, this.apiMethods);
        this.performStartupActions([ProjectsActionsEnum.RequestAllProjects, BuildsActionsEnum.RequestFailedBuilds]);
    }

    private async getSecretKeys(): Promise<void> {
        const ps = new powershell({
            debugMsg: false,
            noProfile: true
        } as powershell.ShellOptions);

        ps.addCommand(`. ${this.appSettings.rootFolder}${USER_DETAILS_PATH}`);
        ps.addCommand('echo $userDetails.teamcityUsername');
        ps.addCommand(
            // tslint:disable-next-line:max-line-length
            '$Credentials = New-Object System.Management.Automation.PSCredential($userDetails.teamcityUsername, ($userDetails.teamcityPasswordSecure  | ConvertTo-SecureString))');
        ps.addCommand('echo $Credentials.GetNetworkCredential().Password');
        ps.addCommand('echo $userDetails.gitlabUsername');
        ps.addCommand(
            // tslint:disable-next-line:max-line-length
            '$Credentials = New-Object System.Management.Automation.PSCredential($userDetails.gitlabUsername, ($userDetails.gitlabPasswordSecure  | ConvertTo-SecureString))');
        ps.addCommand('echo $Credentials.GetNetworkCredential().Password');
        ps.addCommand('echo $userDetails.apiKey');
        ps.on('output', data => {
            const parts = data.split('\r\n');
            this.appSettings.teamCityUsername = parts[0];
            this.userSettings.teamcityApiKey = Buffer.from(`${parts[0]}:${parts[1]}`).toString('base64');
            this.appSettings.gitlabUsername = parts[2];
            this.userSettings.gitlabUsername = parts[2];
            this.userSettings.gitlabPassword = parts[3];
            this.appSettings.apiToken = parts[4];
            this.userSettings.gitlabApiKey = parts[4];
        });

        try {
            await ps.invoke();
        } catch (error) {
            ApplicationLogger.logError(error, null);
        }
    }

    private async nodeApiListener(_: any, payload: IpcPayload) {
        const method = this.apiMethods.get(payload.requestName);
        if (!method) {
            ApplicationLogger.logError(`Unknown nodeApi request: '${payload.requestName}'`, null);
        } else {
            const result = await method(payload.args);
            this.sendAndLogResponse(result[0], result[1]);
        }
    }

    private async sendAndLogResponse(responseName: string, responsePayload: any): Promise<void> {
        switch (responseName) {
            case ProjectsActionsEnum.LocalProjectStatus:
                const localProjectStatusResult = responsePayload as LocalProjectStatusResult;
                if (localProjectStatusResult !== null && localProjectStatusResult.localProject !== null) {
                    const localProjectName = localProjectStatusResult.localProject.name;
                    if (this.gitLabFunctions) {
                        const projects = this.gitLabFunctions.allProjects.filter(p => p.name === localProjectName);
                        if (projects.length > 0 && projects[0].id) {
                            const lastCommit = await this.gitLabFunctions.getMostRecentCommit(projects[0].id);
                            if (lastCommit != null) {
                                localProjectStatusResult.localProject.lastServerCommit = lastCommit;

                                let project = null;
                                if (this.gitLabFunctions) {
                                    project = this.gitLabFunctions.updateLastCommitForProject(projects[0].id, lastCommit);
                                }

                                if (project !== null) {
                                    this.reactClient.send(ProjectsActionsEnum.ReceiveSingleProject, project);
                                }
                            }
                        } else {
                            ApplicationLogger.logError(`Unable to use gitLabFunctions for response ${responseName}`, null);
                        }
                    }
                    if (this.gitFunctions) {
                        await this.gitFunctions.updateLocalProjects();
                    } else {
                        ApplicationLogger.logError(`Unable send response ${responseName}`, null);
                    }
                }
                break;
        }

        this.reactClient.send(responseName, responsePayload);
    }
}
