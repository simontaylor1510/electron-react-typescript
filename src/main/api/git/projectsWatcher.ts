import * as fs from 'async-file';
import { watch } from 'async-file';
import * as Collections from 'typescript-collections';

import { LocalProject } from '../../../renderer/types';
import { LocalProjectStatusResult } from '../../../renderer/types/localProjectStatus';
import { LocalProjectStatusTypeEnum } from '../../../renderer/types';
import { LocalProjectsPersistence } from '../persistence/localProjects';
import { ProjectsActionsEnum } from '../../../renderer/actions/projectEnums';
import { GitProjects } from './projects';
import { AppSettings } from '../../../renderer/types/appSettings';

export class ProjectsWatcher {
    private appSettings: AppSettings;
    private responseSender: (responseName: string, payload: any) => void;
    private logFilename: string;
    private projectFolders: Map<string, LocalProject>;
    private ignoredFolders: Map<string, number>;
    private gitProjects: GitProjects;
    private changedFileQueue: Collections.Queue<string> = new Collections.Queue<string>();
    private changedProjects: Map<string, Date> = new Map<string, Date>();
    private lastNotifications: Map<string, string> = new Map<string, string>();

    constructor(
        appSettings: AppSettings,
        responseSender: (responseName: string, payload: any) => void,
        userDataFolder: string,
        localProjectsPersistence: LocalProjectsPersistence,
        gitProjects: GitProjects) {
        this.appSettings = appSettings;
        this.responseSender = responseSender;
        this.logFilename = `${userDataFolder}\\projectsWatcher.txt`;
        fs.exists(this.logFilename).then(async exists => {
            if (exists) {
                await fs.delete(this.logFilename);
            }
        });
        this.projectFolders = new Map<string, LocalProject>();
        localProjectsPersistence.loadLocalProjects().forEach(p => this.projectFolders.set(p.directoryName, p));
        this.ignoredFolders = new Map<string, number>();
        this.gitProjects = gitProjects;
    }

    public set LocalProjects(localProjects: Map<string, LocalProject>) {
        const originalCount = this.projectFolders.size;
        this.projectFolders.forEach(p => {
            if (!localProjects.has(p.directoryName)) {
                this.projectFolders.delete(p.directoryName);
            }
        });
        localProjects.forEach(p => this.projectFolders.set(p.directoryName, p));
        this.LogStatusMessage(`LocalProjects count changed from ${originalCount} to ${this.projectFolders.size}`);
    }

    public async SetDirectoryIgnoredState(directoryName: string, ignored: boolean) {
        if (ignored && !this.ignoredFolders.has(directoryName)) {
            await this.LogStatusMessage(`ADDED ${directoryName} to ignoredFolders`);
            this.ignoredFolders.set(directoryName, Date.now());
        } else if (!ignored && this.ignoredFolders.has(directoryName)) {
            await this.LogStatusMessage(`REMOVED ${directoryName} from ignoredFolders`);
            this.ignoredFolders.delete(directoryName);
        }
    }

    public async WatchForProjectChanges(callback: (responseName: string, payload: any) => void): Promise<void> {
        await this.LogStatusMessage(`started watching ${this.appSettings.rootFolder}`);

        setInterval(async () => {
            await this.ProcessChanges(callback);
        }, 500);

        await watch(this.appSettings.rootFolder, { recursive: true }, async (fileEvent, filename) => {
            // this.changedFileQueue.add(filename);
            const index = filename === null ? -1 : filename.indexOf('\\');
            if (index >= 0 && filename.indexOf('\\.git') === -1 && !filename.endsWith('\\.git')) {
                const projectDirectory = filename.substring(0, index);
                if (!this.ignoredFolders.has(projectDirectory)) {
                    if (this.projectFolders.has(projectDirectory)) {
                        this.changedProjects.set(projectDirectory, new Date());
                    }
                }
            } else if (index >= 0 && (filename.indexOf('\\.git') !== -1 || !filename.endsWith('\\.git'))) {
                const projectDirectory = filename.substring(0, index);
                if (!this.ignoredFolders.has(projectDirectory)) {
                    if ((filename.indexOf('\\.git\\index') !== -1 || filename.indexOf('\\.git\\refs\\remotes') !== -1)
                        && !filename.endsWith('.lock')) {
                        await this.LogStatusMessage(`Index HAS changed - ${filename}`);
                        this.changedProjects.set(projectDirectory, new Date());
                    }
                }
            }
        });
    }

    private async ProcessChanges(_: any) {
        if (this.changedFileQueue.size() !== 0) {
            await this.LogStatusMessage(`Current queue length: ${this.changedFileQueue.size()}`);
        }
        for (const [directoryName, lastUpdate] of this.changedProjects) {
            await this.LogStatusMessage(`checking ${directoryName}, interval is ${Date.now() - lastUpdate.getTime()}`);
            if (Date.now() - lastUpdate.getTime() > 500) {
                this.changedProjects.delete(directoryName);
                if (!this.ignoredFolders.has(directoryName)) {
                    if (this.projectFolders.has(directoryName)) {
                        const exists = await fs.exists(`${this.appSettings.rootFolder}\\${directoryName}`);
                        if (!exists) {
                            await this.sendDeletedProjectNotification(directoryName);
                        } else {
                            try {
                                const localProject = await this.gitProjects.GetLocalProjectStatus(directoryName);
                                if (localProject === null) {
                                    await this.sendDeletedProjectNotification(directoryName);
                                } else {
                                    const currentState = JSON.stringify(localProject);
                                    if (!this.lastNotifications.has(directoryName) || this.lastNotifications.get(directoryName) !== currentState) {
                                        this.lastNotifications.set(directoryName, currentState);
                                        await this.LogStatusMessage(`PUBLISHED ${directoryName}`);
                                        this.responseSender(ProjectsActionsEnum.LocalProjectStatus, {
                                            batchOperationItem: '',
                                            isBackground: false,
                                            isBatchOperation: false,
                                            isFileSystemEventNotification: true,
                                            localProject,
                                            statusType: LocalProjectStatusTypeEnum.FileEvent
                                        } as LocalProjectStatusResult);
                                    } else {
                                        await this.LogStatusMessage(
                                            `${directoryName} NOT published because it's the same as last time it was published`);
                                    }
                                }
                            } catch (error) {
                                await this.LogStatusMessage(`${directoryName} NOT published because an exception occurred: ${error.message}`);
                            }
                        }
                    } else {
                        const localProject = await this.gitProjects.GetLocalProjectStatus(directoryName);
                        if (localProject && localProject.name && (localProject.httpUrl || localProject.sshUrl)) {
                            await this.LogStatusMessage(`PUBLISHED ${directoryName}`);
                            this.projectFolders.set(localProject.directoryName, localProject);
                            this.responseSender(ProjectsActionsEnum.LocalProjectStatus, {
                                batchOperationItem: '',
                                isBackground: false,
                                isBatchOperation: false,
                                isFileSystemEventNotification: true,
                                localProject,
                                statusType: LocalProjectStatusTypeEnum.FileEvent
                            } as LocalProjectStatusResult);
                        } else {
                            await this.LogStatusMessage(`${directoryName} NOT published because it's not a KNOWN folder`);
                        }
                    }
                } else {
                    await this.LogStatusMessage(`${directoryName} NOT published because it's IGNORED`);
                    await this.sendDeletedProjectNotification(directoryName);
                }
            }
        }
    }

    private async sendDeletedProjectNotification(directoryName: string) {
        await this.LogStatusMessage(`${directoryName} has been deleted - notification sent`);
        this.responseSender(ProjectsActionsEnum.LocalProjectStatus, {
            batchOperationItem: '',
            isBackground: false,
            isBatchOperation: false,
            isFileSystemEventNotification: true,
            localProject: {
                directoryName
            } as LocalProject,
            statusType: LocalProjectStatusTypeEnum.Deleted
        } as LocalProjectStatusResult);
        this.projectFolders.delete(directoryName);
        await this.LogStatusMessage(`${directoryName} deleted from projectFolders map`);
    }

    private async LogStatusMessage(message: string) {
        await fs.appendFile(this.logFilename, `${new Date().toISOString()}: ${message}\r\n`);
    }
}