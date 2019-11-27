import { spawn } from 'child_process';
import { ApplicationActionsEnum } from '../../../renderer/actions/applicationEnums';
import { ApplicationLogger } from '../../utils/logger';
import { GitProjects } from './projects';
import { LocalProject, LocalProjectStatusTypeEnum } from '../../../renderer/types';
import { LocalProjectStatusResult } from '../../../renderer/types/localProjectStatus';
import { LocalProjectsPersistence } from '../persistence/localProjects';
import { ProjectsActionsEnum } from '../../../renderer/actions/projectEnums';
import { ProjectsWatcher } from './projectsWatcher';
import { UserSettings } from '../userSettings';
import { AppSettings } from '../../../renderer/types/appSettings';
import { SettingsActionsEnum } from '../../../renderer/actions';

let firstTime = true;

export class GitFunctions {
    private appSettings: AppSettings;
    private userSettings: UserSettings;
    private gitProjectsWatcher: ProjectsWatcher;
    private gitProjects: GitProjects;
    private responseSender: (responseName: string, payload: any) => void;

    constructor(
        appSettings: AppSettings,
        userSettings: UserSettings,
        responseSender: (responseName: string, payload: any) => void,
        apiMethods: Map<string, (payload?: any) => Promise<[string, any]>>,
        homeFolder: string,
        userFolder: string,
        localProjectsPersistence: LocalProjectsPersistence) {

        this.appSettings = appSettings;
        this.userSettings = userSettings;
        this.responseSender = responseSender;
        this.gitProjects = new GitProjects(this.appSettings, this.userSettings, homeFolder, localProjectsPersistence);
        this.gitProjectsWatcher = new ProjectsWatcher(this.appSettings, this.responseSender, userFolder, localProjectsPersistence, this.gitProjects);

        apiMethods.set(ProjectsActionsEnum.RequestAllLocalProjects, async (): Promise<[string, any]> => {
            if (firstTime) {
                this.responseSender(ProjectsActionsEnum.ReceiveAllLocalProjects, Array.from(this.gitProjects.LocalProjects.values()));
                firstTime = false;
            }

            try {
                const validRepos = await this.gitProjects.GetLocalGitlabRepos();

                return [ProjectsActionsEnum.ReceiveAllLocalProjects, validRepos];
            } catch (error) {
                ApplicationLogger.logError(error.message, error);

                return [ProjectsActionsEnum.RequestAllLocalProjectsError, error];
            }
        });

        apiMethods.set(ProjectsActionsEnum.RequestSingleLocalProjectStatus, async (directoryName: string): Promise<[string, any]> => {
            await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, true);
            try {
                const localProject = await this.gitProjects.GetLocalProjectStatus(directoryName);
                this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, false);

                return [ProjectsActionsEnum.LocalProjectStatus, {
                    batchOperationItem: directoryName,
                    isBackground: false,
                    isBatchOperation: false,
                    localProject,
                    statusType: LocalProjectStatusTypeEnum.Updating
                } as LocalProjectStatusResult];
            } catch (error) {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, false);
                ApplicationLogger.logError(error.message, error);

                return [ProjectsActionsEnum.RequestSingleLocalProjectStatusError, error];
            }
        });

        apiMethods.set(ProjectsActionsEnum.DeleteUntrackedFilesForLocalProject, async (localProject: LocalProject): Promise<[string, any]> => {
            await this.gitProjectsWatcher.SetDirectoryIgnoredState(localProject.directoryName, true);
            try {
                const result = await this.gitProjects.DeleteUntrackedFilesForLocalProject(localProject);
                this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(localProject.directoryName, false);

                return [ProjectsActionsEnum.LocalProjectStatus, {
                    batchOperationItem: result.directoryName,
                    isBatchOperation: false,
                    localProject: result,
                    statusType: LocalProjectStatusTypeEnum.Updating
                } as LocalProjectStatusResult];
            } catch (error) {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(localProject.directoryName, false);
                ApplicationLogger.logError(error.message, error);

                return [ProjectsActionsEnum.DeleteUntrackedFilesForLocalProjectError, error];
            }
        });

        apiMethods.set(ProjectsActionsEnum.CheckoutMasterBranchForLocalProject, async (directoryName: string): Promise<[string, any]> => {
            await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, true);
            try {
                const result = await this.gitProjects.CheckoutMasterBranchForLocalProject(directoryName);
                this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, false);

                return [ProjectsActionsEnum.LocalProjectStatus, {
                    batchOperationItem: result.directoryName,
                    isBatchOperation: false,
                    localProject: result,
                    statusType: LocalProjectStatusTypeEnum.Updating
                } as LocalProjectStatusResult];
            } catch (error) {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, false);
                ApplicationLogger.logError(error.message, error);

                return [ProjectsActionsEnum.CheckoutMasterBranchForLocalProjectError, error];
            }
        });

        apiMethods.set(ProjectsActionsEnum.DiscardSelectedChangesForLocalProject, async (localProject: LocalProject): Promise<[string, any]> => {
            await this.gitProjectsWatcher.SetDirectoryIgnoredState(localProject.directoryName, true);
            try {
                const result = await this.gitProjects.DiscardChangesForLocalProjectItems(localProject);
                this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(localProject.directoryName, false);

                return [ProjectsActionsEnum.LocalProjectStatus, {
                    batchOperationItem: result.directoryName,
                    isBatchOperation: false,
                    localProject: result,
                    statusType: LocalProjectStatusTypeEnum.Updating
                } as LocalProjectStatusResult];
            } catch (error) {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(localProject.directoryName, false);
                ApplicationLogger.logError(error.message, error);

                return [ProjectsActionsEnum.DiscardSelectedChangesForLocalProjectError, error];
            }
        });

        apiMethods.set(ApplicationActionsEnum.WatchForProjectChanges, async (): Promise<[string, any]> => {
            this.gitProjectsWatcher.WatchForProjectChanges(this.responseSender);
            return ['', {}];
        });

        apiMethods.set(ProjectsActionsEnum.RemoveLocalProject,
            async (payload: { directoryName: string, removeAll: boolean }): Promise<[string, any]> => {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, true);
                try {
                    await this.gitProjects.RemoveDeprecatedRepository(payload.directoryName);
                    this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;
                    await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, false);

                    return [ProjectsActionsEnum.LocalProjectStatus, {
                        batchOperationItem: payload.directoryName,
                        isBackground: false,
                        isBatchOperation: payload.removeAll,
                        isFileSystemEventNotification: false,
                        localProject: null,
                        statusType: LocalProjectStatusTypeEnum.Removing
                    } as LocalProjectStatusResult];
                } catch (error) {
                    await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, false);
                    ApplicationLogger.logError(error.message, error);

                    return [ProjectsActionsEnum.RemoveLocalProjectError, { error, removingAll: payload.removeAll }];
                }
            });

        apiMethods.set(ProjectsActionsEnum.UpdateLocalProject,
            async (payload: { directoryName: string, updateAll: boolean, background: boolean }): Promise<[string, any]> => {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, true);
                try {
                    // const localProject = await this.gitProjects.UpdateRepository(payload.directoryName);
                    const localProject = this.gitProjects.LocalProjects.get(payload.directoryName) || {} as LocalProject;
                    this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;
                    await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, false);

                    return [ProjectsActionsEnum.LocalProjectStatus, {
                        batchOperationItem: localProject !== null ? localProject.directoryName : null,
                        isBackground: payload.background,
                        isBatchOperation: payload.updateAll,
                        localProject,
                        statusType: LocalProjectStatusTypeEnum.Updating
                    } as LocalProjectStatusResult];
                } catch (error) {
                    await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, false);
                    ApplicationLogger.logError(error.message, error);

                    return [ProjectsActionsEnum.UpdateLocalProjectError, { error, updatingAll: payload.updateAll }];
                }
            });

        apiMethods.set(ProjectsActionsEnum.CheckoutLocalProject, async (payload: { url: string, checkoutAll: boolean }): Promise<[string, any]> => {
            const directoryName = this.gitProjects.GetNameFromProjectUrl(payload.url);
            await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, true);
            try {
                const localProject = await this.gitProjects.CheckoutRepositoryFromGitLab(payload.url);
                this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, false);

                return [ProjectsActionsEnum.LocalProjectStatus, {
                    batchOperationItem: payload.url,
                    isBatchOperation: payload.checkoutAll,
                    localProject,
                    statusType: LocalProjectStatusTypeEnum.Cloning
                } as LocalProjectStatusResult];
            } catch (error) {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, false);
                ApplicationLogger.logError(error.message, error);

                return [ProjectsActionsEnum.CheckoutLocalProjectError, {
                    checkingOutAll: payload.checkoutAll,
                    currentItem: payload.url,
                    error
                }];
            }
        });

        apiMethods.set(ProjectsActionsEnum.CleanLocalProjectFolder, async (payload: { directoryName: string }): Promise<[string, any]> => {
            await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, true);
            try {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, false);
                const localProject = await this.gitProjects.CleanLocalProjectFolder(payload.directoryName);

                await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, false);

                return [ProjectsActionsEnum.LocalProjectStatus, {
                    batchOperationItem: null,
                    isBatchOperation: false,
                    localProject,
                    statusType: LocalProjectStatusTypeEnum.Cleaning
                } as LocalProjectStatusResult];
            } catch (error) {
                await this.gitProjectsWatcher.SetDirectoryIgnoredState(payload.directoryName, false);
                ApplicationLogger.logError(error.message, error);

                return [ProjectsActionsEnum.CleanLocalProjectFolderError, {
                    currentItem: payload.directoryName,
                    error
                }];
            }
        });

        apiMethods.set(ProjectsActionsEnum.OpenTortoiseGitCommitDialog, async (directoryName: string): Promise<[string, any]> => {
            await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, true);

            const localProject = await this.gitProjects.GetLocalProjectStatus(directoryName);
            this.gitProjectsWatcher.LocalProjects = this.gitProjects.LocalProjects;

            spawn(
                'C:\\Program Files\\TortoiseGit\\bin\\TortoiseGitProc.exe',
                ['/command:commit', `/path:${this.appSettings.rootFolder}\\${directoryName}`]
            );

            await this.gitProjectsWatcher.SetDirectoryIgnoredState(directoryName, false);

            return [ProjectsActionsEnum.LocalProjectStatus, {
                batchOperationItem: null,
                isBatchOperation: false,
                localProject,
                statusType: LocalProjectStatusTypeEnum.Cleaning
            } as LocalProjectStatusResult];
        });

        apiMethods.set(
            SettingsActionsEnum.VerifyGitCredentials, async (payload: { username: string, password: string }): Promise<[string, any]> => {
            const result = await this.gitProjects.VerifyCredentials(payload.username, payload.password);
            return Promise.resolve([SettingsActionsEnum.VerifyGitCredentialsResult, result]);
        });
    }

    public async updateLocalProjects() {
        await this.gitProjects.PersistLocalProjects();
    }
}
