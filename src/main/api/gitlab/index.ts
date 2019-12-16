import { ApplicationLogger } from '../../utils/logger';

import { UserSettings } from '../userSettings';
import { ProjectsActionsEnum } from '../../../renderer/actions/projectEnums';
import { GitLabProjects } from './projects';
import { ServerProjectsPersistence } from '../persistence/gitlabProjects';
import { Commit, Project } from '../../../renderer/types';
import { GitLabApiClient } from './shared';
import { SettingsActionsEnum } from '../../../renderer/actions';

export class GitLabFunctions {
    private apiMethods: Map<string, (payload?: any) => Promise<[string, any]>>;
    private userSettings: UserSettings;
    private responseSender: (responseName: string, payload: any) => void;
    private gitLabProjects: GitLabProjects;
    private firstTime: boolean = true;

    constructor(
        userSettings: UserSettings,
        responseSender: (responseName: string, payload: any) => void,
        apiMethods: Map<string, (payload?: any) => Promise<[string, any]>>, serverProjectsPersistence: ServerProjectsPersistence) {
        this.apiMethods = apiMethods;
        this.userSettings = userSettings;
        this.responseSender = responseSender;
        this.gitLabProjects = new GitLabProjects(this.userSettings, serverProjectsPersistence);
        this.gitLabProjects.listenForPushEvents(responseSender);

        apiMethods.set(ProjectsActionsEnum.RequestAllProjects, async (): Promise<[string, any]> => {
            if (this.firstTime) {
                this.responseSender(ProjectsActionsEnum.ReceiveStoredProjects, this.gitLabProjects.currentProjects);
                this.firstTime = false;
            }
            try {
                const projects = await this.gitLabProjects.getAllProjects();
                return [ProjectsActionsEnum.ReceiveAllProjects, projects];
            } catch (error) {
                ApplicationLogger.logError('error in getAllProjects', error);
                ApplicationLogger.logError(error.message, error);
                return [ProjectsActionsEnum.RequestAllProjectsError, error];
            }
        });

        apiMethods.set(SettingsActionsEnum.VerifyGitlabApiToken, async (payload: any): Promise<[string, any]> => {
            const result = await this.getUserStatus(payload.apiToken);
            return Promise.resolve([SettingsActionsEnum.VerifyGitlabApiTokenResult, result]);
        });
    }

    public terminate(): void {
        this.apiMethods.delete(ProjectsActionsEnum.RequestAllProjects);
        this.apiMethods.delete(SettingsActionsEnum.VerifyGitlabApiToken);
        this.apiMethods.delete(SettingsActionsEnum.VerifyGitCredentials);
    }

    public get allProjects(): Project[] {
        return this.gitLabProjects.currentProjects;
    }

    public async getMostRecentCommit(projectId: number): Promise<Commit | null> {
        try {
            return await this.gitLabProjects.getMostRecentCommit(projectId);
        } catch (error) {
            ApplicationLogger.logError(`error in GetMostRecentCommit`, error);
            ApplicationLogger.logError(error.message, error);
            return null;
        }
    }

    public updateLastCommitForProject(projectId: number, lastCommit: Commit): Project | null {
        const projects = this.gitLabProjects.currentProjects.filter(p => p.id === projectId);
        if (projects.length === 1) {
            projects[0].last_commit = lastCommit;
            return projects[0];
        }

        return null;
    }

    private async getUserStatus(apiToken: string): Promise<{ success: boolean, invalidCredentials: boolean, failureReason: string | null }> {
        let client: GitLabApiClient | undefined;
        try {
            client = new GitLabApiClient();
            await client.makeGetRequest(apiToken, `/user/status`);
            return { success: true, invalidCredentials: false, failureReason: null };
        } catch (error) {
            if (client) {
                client.resetErrors();
            }
            ApplicationLogger.logError(`error in GetUserDetails`, error);
            ApplicationLogger.logError(error.message, error);
            return { success: false, invalidCredentials: error.message.startsWith('Status code 401'), failureReason: error.message };
        }
    }
}
