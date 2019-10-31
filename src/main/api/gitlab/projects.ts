import * as RunParallelLimit from 'run-parallel-limit';
import { Task } from 'run-parallel-limit';

import { GitLabApiClient } from './shared';

import { Project, Commit } from '../../../renderer/types';
import { ApplicationLogger } from '../../utils/logger';
import { DEPRECATED_PROJECTS, IGNORED_PROJECT_SUFFIXES } from './constants';
import { ServerProjectsPersistence } from '../persistence/gitlabProjects';
import { UserSettings } from '../userSettings';

import { listenForEmails } from '../system/emailNotificationsListener';
import { ProjectsActionsEnum } from '../../../renderer/actions';

const PARALLEL_TASKS = 5;

// (Utility.DevelopmentScripts)(AL-3141: Updated GetEmailsOnPushSettings to add to projects where it's not set.)
const gitlabMasterPushRegexp = /\[Git\]\[AbstractionLayer\/(\S*)\]\[master\]\s+(\S.*)/;
const gitlabBranchPushRegexp = /\[Git\]\[AbstractionLayer\/(\S*)\]\[(?!master)\S+\].*/;
const gitlabNewOrDeletedTagOrBranchRegexp = /\[Git\]\[AbstractionLayer\/(\S*)\] (?:Pushed new|Deleted) (?:branch|tag) .*/;

interface ProjectOrSubProjectTaskResult {
    project: Project;
    subProject: Project;
}

export class GitLabProjects {
    private static IsCommit(maybeCommit: any): maybeCommit is Commit {
        if (maybeCommit == null) {
            return false;
        }
        return (maybeCommit as Commit).committer_email !== undefined;
    }

    private gitLabApiClient: GitLabApiClient = new GitLabApiClient();
    private userSettings: UserSettings;
    private serverProjectsPersistence: ServerProjectsPersistence;
    private allProjects: Project[];

    constructor(userSettings: UserSettings, serverProjectsPersistence: ServerProjectsPersistence) {
        this.userSettings = userSettings;
        this.serverProjectsPersistence = serverProjectsPersistence;
        this.allProjects = this.serverProjectsPersistence.loadServerProjects();
    }

    public get currentProjects(): Project[] {
        return this.allProjects;
    }

    public async getAllProjects(): Promise<Project[]> {
        const descopedProjects: string[] = [];
        let responseData: Project[];

        responseData = await this.downloadAllProjects();

        const finallyFiltered = responseData.filter(p => p !== null && descopedProjects.indexOf(p.name) === -1);
        this.serverProjectsPersistence.saveServerProjects(finallyFiltered);
        return finallyFiltered;
    }

    public async getMostRecentCommit(projectId: number): Promise<Commit | null> {
        const response = await this.gitLabApiClient.makeGetRequest(
            this.userSettings.gitlabApiKey,
            `/projects/${projectId}/repository/commits?page=0&per_page=1`);
        const commits = response as Commit[];
        if (commits.length === 1) {
            return commits[0] as Commit;
        }

        return null;
    }

    public listenForPushEvents(responseSender: (responseName: string, payload: any) => void): void {
        listenForEmails('gitlab.to.slack.bjss@gmail.com', 'zngieztvpcjshbyi', ['tooling.team@easyjet.com'], async (subject) => {
            let matches = gitlabNewOrDeletedTagOrBranchRegexp.exec(subject);
            if (matches !== null && matches.length === 2) {
                return;
            }

            matches = gitlabBranchPushRegexp.exec(subject);
            if (matches !== null && matches.length === 2) {
                return;
            }

            matches = gitlabMasterPushRegexp.exec(subject);
            if (matches !== null && matches.length === 3) {
                const projectName = matches[1].replace('.Behaviour', '').replace('.Contract', '');
                const project = this.currentProjects.find(p => p.name === projectName);
                if (project) {
                    const lastCommit = await this.getMostRecentCommit(project.id);
                    if (lastCommit !== null && !(lastCommit instanceof Error)) {
                        if (project.last_commit === null || project.last_commit.id !== lastCommit.id) {
                            project.last_commit = lastCommit;
                            responseSender(ProjectsActionsEnum.ReceiveSingleProject, project);
                        }
                    }
                }
            } else {
                ApplicationLogger.logInfo(`Unexpected email subject: "${subject}"`);
            }
        });
    }

    private async downloadAllProjects(): Promise<Project[]> {
        let projects: Project[];
        let projectsICanAccess: Project[];
        await Promise.all([
            projects = await this.gitLabApiClient.makePagedGetRequest(
                this.userSettings.gitlabApiKey,
                '/groups/AbstractionLayer/projects?archived=false'),
            projectsICanAccess = await this.gitLabApiClient.makePagedGetRequest(this.userSettings.gitlabApiKey, '/projects?archived=false')
        ]);

        projects.forEach(p => {
            if (projectsICanAccess.findIndex(p1 => p1.id === p.id) === -1) {
                p.needs_permissions_stick_shaking = true;
            }
        });

        const ids: number[] = [];
        const filtered = projects.filter((project) => {
            let result = false;
            if (DEPRECATED_PROJECTS.indexOf(project.name) === -1) {
                result = ids.indexOf(project.id) === -1;
                if (result) {
                    ids.push(project.id);
                }
            }

            return result;
        });

        const tasks: Array<Task<ProjectOrSubProjectTaskResult>> = [];

        filtered.filter(p => IGNORED_PROJECT_SUFFIXES.filter(suffix => p.name.endsWith(suffix)).length === 0).map(project => {
            tasks.push(async (callback) => {
                const mostRecentCommit = await this.getMostRecentCommit(project.id);

                if (mostRecentCommit instanceof Error) {
                    ApplicationLogger.logError(`ERROR for ${project.id}(${project.name})`, mostRecentCommit);
                    callback(mostRecentCommit);
                } else if (GitLabProjects.IsCommit(mostRecentCommit)) {
                    project.last_commit = mostRecentCommit;
                }
                callback(null, { project } as ProjectOrSubProjectTaskResult);
            });
        });

        filtered.filter(p => IGNORED_PROJECT_SUFFIXES.filter(suffix => p.name.endsWith(suffix)).length !== 0).map(subProject => {
            tasks.push(async (callback) => {
                const mostRecentCommit = await this.getMostRecentCommit(subProject.id);

                if (mostRecentCommit instanceof Error) {
                    ApplicationLogger.logError(`ERROR for ${subProject.id}(${subProject.name})`, mostRecentCommit);
                    callback(mostRecentCommit);
                } else if (GitLabProjects.IsCommit(mostRecentCommit)) {
                    subProject.last_commit = mostRecentCommit;
                }
                callback(null, { subProject } as ProjectOrSubProjectTaskResult);
            });
        });

        const promise: Promise<ProjectOrSubProjectTaskResult[]> = new Promise((resolve, reject) => {
            RunParallelLimit(tasks, PARALLEL_TASKS, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
        const intermediateResults = await promise;
        const actualResults: Project[] = [];
        intermediateResults.filter(ir => ir.project).forEach(ir => actualResults.push(ir.project));
        intermediateResults.filter(ir => ir.subProject).forEach(ir => {
            const resultsToUpdate = actualResults.filter(p => ir.subProject.name.startsWith(p.name));
            if (resultsToUpdate.length > 0 && ir.subProject.last_commit) {
                if (!resultsToUpdate[0].last_commit || resultsToUpdate[0].last_commit.created_at < ir.subProject.last_commit.created_at) {
                    resultsToUpdate[0].last_commit = ir.subProject.last_commit;
                    resultsToUpdate[0].last_commit.fromSubModule = ir.subProject.name.substring(resultsToUpdate[0].name.length + 1);
                }
            }
        });

        return actualResults;
    }
}
