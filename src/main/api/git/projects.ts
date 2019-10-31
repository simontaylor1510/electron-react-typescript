import * as fs from 'async-file';
import * as os from 'os';
import * as RunParallelLimit from 'run-parallel-limit';
import { Task } from 'run-parallel-limit';
import { performance } from 'perf_hooks';
import {
    Repository,
    StatusFile,
    Remote,
    Reset,
    CheckoutOptions,
    AnnotatedCommit,
    Clone,
    Commit,
    Cred,
    Submodule,
    Stash,
    FetchOptions,
    CloneOptions,
    Merge,
    SubmoduleUpdateOptions,
    Graph,
    Status
} from 'nodegit';

import {
    HTTP_URL_PREFIX,
    URL_SUFFIX,
    SSH_URL_PREFIX,
    SSH_PUBLIC_KEY_FILE,
    SSH_PRIVATE_KEY_FILE,
    SSH_ENCRYPTION_PASSPHRASE
} from './constants';
import { ApplicationLogger } from '../../utils/logger';
import { asyncForEach } from '../../utils/async';
import { LocalProject, Progress, LocalFileStatus } from '../../../renderer/types';
import { LocalProjectsPersistence } from '../persistence/localProjects';
import { createSome, createNone, Option } from 'option-t';
import { UserSettings } from '../userSettings';
import { AppSettings } from '../../../renderer/types/appSettings';

export class GitProjects {
    private PARALLEL_TASKS: number = 20;

    private appSettings: AppSettings;
    private userSettings: UserSettings;
    private homeFolder: string;
    private localProjectsPersistence: LocalProjectsPersistence;
    private localProjects: Map<string, LocalProject>;

    public constructor(appSettings: AppSettings, userSettings: UserSettings, homeFolder: string, localProjectsPersistence: LocalProjectsPersistence) {
        this.appSettings = appSettings;
        this.userSettings = userSettings;
        this.homeFolder = homeFolder;
        this.localProjectsPersistence = localProjectsPersistence;
        this.localProjects = this.localProjectsPersistence.loadLocalProjects();
    }

    public get LocalProjects(): Map<string, LocalProject> {
        return this.localProjects;
    }

    public async PersistLocalProjects(): Promise<void> {
        await this.localProjectsPersistence.saveLocalProjects(this.localProjects);
    }

    public GetDirectoryNameFromName(projectName: string): Option<string> {
        let result: Option<string> = createNone();

        this.localProjects.forEach(lp => {
            if (lp.name === projectName) {
                result = createSome(lp.directoryName);
            }
        });

        return result;
    }

    public async RemoveDeprecatedRepository(directoryName: string): Promise<void> {
        const fullPath: string = `${this.appSettings.rootFolder}\\${directoryName}`;

        try {
            if ((await fs.exists(fullPath)) && (await fs.lstat(fullPath)).isDirectory) {
                await fs.rimraf(fullPath);
            }

            this.localProjects.delete(directoryName);
            await this.localProjectsPersistence.saveLocalProjects(this.localProjects);
        } catch (error) {
            ApplicationLogger.logError(`Failed to remove ${directoryName}`, error);
            ApplicationLogger.logError(error.message, error);
        }
    }

    public async CheckoutRepositoryFromGitLab(url: string): Promise<LocalProject | null> {
        const name = this.GetNameFromProjectUrl(url);
        const fullPath = `${this.appSettings.rootFolder}\\${name}`;
        let repository: Repository;

        try {
            repository = await Clone.clone(url, fullPath, this.CloneOptions());
            const subModules = await repository.getSubmoduleNames();
            await asyncForEach(subModules, async (subModuleName: string, _: number, __: string[]) => {
                try {
                    await this.CloneSubmodule(repository, name, subModuleName);
                } catch (error) {
                    ApplicationLogger.logError(`Failed to clone ${subModuleName} to ${fullPath}\\${subModuleName}`, error);
                    ApplicationLogger.logError(error.message, error);
                    throw error;
                }
            });

            let localProject = await this.GetLocalProjectStatus(name);
            if (localProject !== null) {
                localProject = await this.DiscardChangesForLocalProjectItems(localProject);
            }

            if (localProject !== null) {
                this.localProjects.set(localProject.directoryName, localProject);
                await this.localProjectsPersistence.saveLocalProjects(this.localProjects);
            }

            return localProject;
        } catch (error) {
            ApplicationLogger.logError(`Failed to clone ${url} to ${name}`, error);
            ApplicationLogger.logError(error.message, error);
            if ((await fs.exists(fullPath)) && (await fs.lstat(fullPath)).isDirectory) {
                await fs.rimraf(fullPath);
                ApplicationLogger.logInfo(`Deleted ${fullPath}`);
            }
            return null;
        }
    }

    public async UpdateRepository(directoryName: string): Promise<LocalProject | null> {
        let localProject = await this.GetLocalProjectStatus(directoryName);

        if (localProject === null) {
            return null;
        }

        let updateResult = await this.UpdateSingleRepository(localProject);
        if (updateResult instanceof Error) {
            throw updateResult;
        }

        const fullPath = `${this.appSettings.rootFolder}\\${localProject.directoryName}`;
        const repository = await Repository.open(fullPath);
        const subModules = await repository.getSubmoduleNames();
        await asyncForEach(subModules, async (subModuleName: string, _: number, __: string[]) => {
            try {
                const subModuleLocalProject = await this.GetLocalProjectFromDirectory(`${fullPath}\\${subModuleName}`, true);
                updateResult = await this.UpdateSingleRepository(subModuleLocalProject);
                if (updateResult instanceof Error) {
                    throw updateResult;
                }
            } catch (error) {
                try {
                    await this.CloneSubmodule(repository, directoryName, subModuleName);
                } catch (error) {
                    throw error;
                }
            }
        });

        localProject = await this.GetLocalProjectStatus(directoryName);
        if (localProject !== null) {
            this.localProjects.set(directoryName, localProject);
            await this.localProjectsPersistence.saveLocalProjects(this.localProjects);
        }
        return localProject;
    }

    public async GetLocalProjectStatus(directoryName: string): Promise<LocalProject | null> {
        return await this.GetLocalProjectFromDirectory(`${this.appSettings.rootFolder}\\${directoryName}`, false);
    }

    public async DeleteUntrackedFilesForLocalProject(localProject: LocalProject): Promise<LocalProject> {
        return new Promise<LocalProject>(async resolve => {
            const filesToDelete = localProject.status.filter(sf => sf.inWorkingTree && sf.isNew);
            await asyncForEach(filesToDelete, async (newFile: LocalFileStatus, _: number, __: LocalFileStatus[]) => {
                const fullPath = `${this.appSettings.rootFolder}\\${localProject.directoryName}/${newFile.path}`;

                try {
                    if (await fs.exists(fullPath)) {
                        await fs.delete(fullPath);
                    }
                } catch (error) {
                    ApplicationLogger.logError(`Failed to delete ${fullPath}`, error);
                }
            });

            localProject = await this.GetLocalProjectFromDirectory(`${this.appSettings.rootFolder}\\${localProject.directoryName}`, false);
            this.localProjects.set(localProject.directoryName, localProject);
            await this.localProjectsPersistence.saveLocalProjects(this.localProjects);

            resolve(localProject);
        });
    }

    public async CheckoutMasterBranchForLocalProject(directoryName: string): Promise<LocalProject> {
        return new Promise<LocalProject>(async resolve => {
            const repository = await Repository.open(`${this.appSettings.rootFolder}\\${directoryName}`);
            await repository.checkoutBranch('refs/heads/master');

            const localProject = await this.GetLocalProjectFromDirectory(`${this.appSettings.rootFolder}\\${directoryName}`, false);
            this.localProjects.set(localProject.directoryName, localProject);
            await this.localProjectsPersistence.saveLocalProjects(this.localProjects);

            resolve(localProject);
        });
    }

    public async DiscardChangesForLocalProjectItems(localProject: LocalProject): Promise<LocalProject> {
        return new Promise<LocalProject>(async resolve => {
            const repository = await Repository.open(`${this.appSettings.rootFolder}\\${localProject.directoryName}`);
            const commit = await repository.getCommit(localProject.commitSha);
            const annotatedCommit = await AnnotatedCommit.lookup(repository, commit.id());
            const filenames = localProject.status.filter(sf => sf.isSelected && sf.inWorkingTree && !sf.isNew).map(sf => sf.path);
            const options = {
                paths: filenames,
            } as CheckoutOptions;
            await Reset.fromAnnotated(repository, annotatedCommit, Reset.TYPE.HARD, options);
            const files = localProject.status.filter(sf => sf.isSelected && sf.inWorkingTree && sf.isNew);
            const index = await repository.refreshIndex();
            await asyncForEach(files, async (file: LocalFileStatus, _: number, __: LocalFileStatus[]) => {
                const fullPath = `${this.appSettings.rootFolder}\\${localProject.directoryName}/${file.path}`;

                try {
                    await index.removeByPath(file.path);
                    if (await fs.exists(fullPath)) {
                        await fs.delete(fullPath);
                    }
                } catch (error) {
                    ApplicationLogger.logError(`Failed to delete ${fullPath}`, error);
                }
            });
            index.writeTree();

            localProject = await this.GetLocalProjectFromDirectory(`${this.appSettings.rootFolder}\\${localProject.directoryName}`, false);
            this.localProjects.set(localProject.directoryName, localProject);
            await this.localProjectsPersistence.saveLocalProjects(this.localProjects);

            resolve(localProject);
        });
    }

    public async GetLocalGitlabRepos(): Promise<LocalProject[]> {
        const startTime = performance.now();

        const dirs = await this.GetAllDirectoriesInLocalFolder();

        this.localProjects.forEach((_: LocalProject, key: string) => {
            if (dirs.indexOf(key) === -1) {
                this.localProjects.delete(key);
            }
        });

        const newDirs = dirs.filter(dir => !this.localProjects.has(dir));

        const tasks: Array<Task<LocalProject>> = [];

        const progress = {
            actualCount: 0,
            expectedCount: dirs.length,
            skippedCount: 0,
        } as Progress;

        newDirs.sort().map(async dir => {
            tasks.push(async (callback: (error: Error | null, localProject?: LocalProject) => void) => {
                progress.actualCount++;
                try {
                    const localProject = await this.GetLocalProjectFromDirectory(`${this.appSettings.rootFolder}\\${dir}`, false);
                    progress.actualCount++;
                    if (localProject.name && (localProject.httpUrl || localProject.sshUrl)) {
                        callback(null, localProject);
                    } else {
                        this.localProjects.delete(localProject.directoryName);
                        callback(null);
                    }
                } catch (error) {
                    ApplicationLogger.logError(`Ignored (ERROR): ${this.appSettings.rootFolder}\\${dir}`, error);
                    ApplicationLogger.logError(error.message, error);
                    progress.skippedCount++;
                    callback(null);
                }
            });
        });

        this.localProjects.forEach(async localProject => {
            tasks.push(async (callback: (error: Error | null, localProject?: LocalProject) => void) => {
                try {
                    const fullDir = `${this.appSettings.rootFolder}\\${localProject.directoryName}`;
                    localProject = await this.GetLocalProjectFromDirectory(fullDir, false);
                    progress.actualCount++;
                    callback(null, localProject);
                } catch (error) {
                    progress.skippedCount++;
                    callback(null);
                }
            });
        });

        return new Promise<LocalProject[]>(async (resolve, reject) => {
            RunParallelLimit(tasks, this.PARALLEL_TASKS, async (error: Error, results: LocalProject[]) => {
                if (error) {
                    ApplicationLogger.logError('Caught an error', error);
                    reject(error);
                } else {
                    const filteredResults = results.filter(r => r != null);
                    await this.localProjectsPersistence.saveLocalProjects(this.localProjects);
                    const endTime = performance.now();
                    ApplicationLogger.logInfo(`Processed ${dirs.length} directories in ${endTime - startTime}ms`);
                    resolve(filteredResults);
                }
            });
        });
    }

    public async GetLocalProjectFromDirectory(directoryName: string, submodule: boolean): Promise<LocalProject> {
        try {
            const repository = await Repository.open(directoryName);
            const masterCommit = await repository.getMasterCommit();
            const remoteMasterCommit = await repository.getReferenceCommit('origin/master');
            const status: StatusFile[] = await repository.getStatus();
            const currentBranch = await repository.getCurrentBranch();
            const aheadBehind = (await Graph.aheadBehind(repository, masterCommit.id(), remoteMasterCommit.id())) as any;
            let dirtyCount = await this.GetFilesToCleanCount(directoryName);

            const localProject = {
                ahead: aheadBehind.ahead,
                behind: aheadBehind.behind,
                commitSha: masterCommit.sha(),
                currentBranch: currentBranch.name(),
                directoryName: directoryName.substring(this.appSettings.rootFolder.length + 1),
                status: this.ConvertStatusObjects(status),
            } as LocalProject;

            localProject.localCommits = await this.GetLocalCommitHistory(masterCommit);

            const subModules = await repository.getSubmoduleNames();
            await asyncForEach(subModules, async (subModuleName: string, _: number, __: string[]) => {
                dirtyCount += await this.GetFilesToCleanCount(`${directoryName}\\${subModuleName}`);
                const modifiedSubModules = localProject.status.filter(s => s.path === subModuleName);
                if (modifiedSubModules.length === 1) {
                    modifiedSubModules[0].isSubmodule = true;
                    const subModule = await Submodule.lookup(repository, subModuleName);
                    try {
                        const subModuleRepository = await Repository.open(`${directoryName}\\${subModuleName}`);
                        const headCommit = await subModuleRepository.getMasterCommit();
                        if (!subModule.headId().equal(headCommit.id()) && (await subModuleRepository.getStatus()).length === 0) {
                            modifiedSubModules[0].isAheadSubmodule = true;
                        }
                    } catch (error) {
                        ApplicationLogger.logError(`Unable to open submodule ${subModuleName} for ${localProject.directoryName}`, error);
                    }
                }
            });

            const remote = await Remote.lookup(repository, 'origin');
            const url = remote.url();
            if (url.startsWith(HTTP_URL_PREFIX) && url.endsWith(URL_SUFFIX)) {
                localProject.httpUrl = url;
            } else if (url.startsWith(SSH_URL_PREFIX) && url.endsWith(URL_SUFFIX)) {
                localProject.sshUrl = url;
            }
            localProject.name = this.GetNameFromProjectUrl(url);
            localProject.canBeCleaned = dirtyCount > 0;

            if (!submodule && localProject.name) {
                this.localProjects.set(localProject.directoryName, localProject);
            }

            return localProject;
        } catch (error) {
            ApplicationLogger.logError(`Unable to GetLocalProjectFromDirectory: ${directoryName}`, error);
            throw error;
        }
    }

    public async CleanLocalProjectFolder(directoryName: string): Promise<LocalProject | null> {
        try {
            const fullPath = `${this.appSettings.rootFolder}\\${directoryName}`;
            const repository = await Repository.open(fullPath);
            const localProject = await this.GetLocalProjectFromDirectory(fullPath, false);

            const index = await repository.refreshIndex();
            await asyncForEach(localProject.status, async (lfs: LocalFileStatus) => {
                if (lfs.isNew) {
                    await index.addByPath(lfs.path);
                }
            });
            await index.write();

            await this.CleanIgnoredFilesFromRepository(fullPath, repository);

            const subModules = await repository.getSubmoduleNames();
            await asyncForEach(subModules, async (subModuleName: string, _: number, __: string[]) => {
                const subRepoFolder = `${fullPath}\\${subModuleName}`;
                const subModuleRepository = await Repository.open(subRepoFolder);
                await this.CleanIgnoredFilesFromRepository(subRepoFolder, subModuleRepository);
            });

            return await this.GetLocalProjectFromDirectory(fullPath, false);
        } catch (error) {
            ApplicationLogger.logError(`Failed to clean folder: ${directoryName}`, error);
            return null;
        }
    }

    public GetNameFromProjectUrl(projectUrl: string): string {
        if (projectUrl.startsWith(HTTP_URL_PREFIX) && projectUrl.endsWith(URL_SUFFIX)) {
            return projectUrl.substring(HTTP_URL_PREFIX.length, projectUrl.length - URL_SUFFIX.length);
        } else if (projectUrl.startsWith(SSH_URL_PREFIX) && projectUrl.endsWith(URL_SUFFIX)) {
            return projectUrl.substring(SSH_URL_PREFIX.length, projectUrl.length - URL_SUFFIX.length);
        }

        return '';
    }

    public async VerifyCredentials(username: string, password: string): Promise<CredentialsValidationResult> {
        const url = `${HTTP_URL_PREFIX}Utility.DevelopmentScripts${URL_SUFFIX}`;
        const name = this.GetNameFromProjectUrl(url);
        const fullPath = `${os.tmpdir()}\\${name}`;

        try {
            await Clone.clone(url, fullPath, {
                fetchOpts: {
                    callbacks: {
                        credentials: () => Cred.userpassPlaintextNew(username, password)
                    },
                    certificateCheck: () => 1,
                } as FetchOptions
            });
            if ((await fs.exists(fullPath)) && (await fs.lstat(fullPath)).isDirectory) {
                await fs.rimraf(fullPath);
            }

            return { success: true, invalidCredentials: false, failureReason: null };
        } catch (error) {
            ApplicationLogger.logError('Invalid credentials', error);
            return {
                failureReason: error.message,
                invalidCredentials: error.message.startsWith('failed to send request') ? false : true,
                success: false
            };
        }
    }

    private async GetFilesToCleanCount(projectFolder: string): Promise<number> {
        try {
            const repository = await Repository.open(projectFolder);
            const statusFiles = await repository.getStatusExt({ flags: Status.OPT.INCLUDE_IGNORED });
            const ignoredFiles = statusFiles.filter(sf => sf.status().filter(s => s === 'IGNORED').length !== 0).map(sf => sf.path());
            return ignoredFiles.length;
        } catch (error) {
            ApplicationLogger.logError(`Failed to obtain 'dirty' file count for ${projectFolder}`, error);
            return 0;
        }
    }

    private async CleanIgnoredFilesFromRepository(projectFolder: string, repository: Repository): Promise<void> {
        const statusFiles = await repository.getStatusExt({
            flags: Status.OPT.INCLUDE_IGNORED
        });

        await asyncForEach(statusFiles, async (statusFile) => {
            if (statusFile.status().find((status: string) => status === 'IGNORED')) {
                try {
                    const fullFilename = `${projectFolder}\\${statusFile.path()}`;
                    await fs.rimraf(fullFilename);
                } catch (error) {
                    ApplicationLogger.logError(`Failed to remove ${statusFile.path()}`, error);
                }
            }
        });
    }

    private async GetLocalCommitHistory(masterCommit: Commit): Promise<string[]> {
        const history = masterCommit.history();
        return await new Promise<string[]>(resolve => {
            const commits: string[] = [];
            history.on('commit', (commit: Commit) => {
                commits.push(commit.id().tostrS());
            });
            history.on('end', (_: any) => {
                resolve(commits);
            });
            history.start();
        });
    }

    private async CloneSubmodule(repository: Repository, directoryName: string, submoduleName: string): Promise<void> {
        const fullPath = `${this.appSettings.rootFolder}\\${directoryName}`;

        let subModule = await Submodule.lookup(repository, submoduleName);
        const url = subModule.url();
        if (url.startsWith(SSH_URL_PREFIX)) {
            await Submodule.setUrl(repository, submoduleName, url.replace(SSH_URL_PREFIX, HTTP_URL_PREFIX));
            subModule = await Submodule.lookup(repository, submoduleName);
        }
        await subModule.sync();
        const updateResult = await subModule.update(1, {
            fetchOpts: this.CloneOptions().fetchOpts,
        } as SubmoduleUpdateOptions);
        if (updateResult === 0) {
            const subModuleRepo = await Repository.open(`${fullPath}\\${submoduleName}`);
            await subModuleRepo.checkoutBranch('master');
        }
    }

    private async UpdateSingleRepository(localProject: LocalProject): Promise<boolean | Error> {
        try {
            let changesStashed = false;

            if (localProject.status.length !== 0) {
                changesStashed = await this.StashCurrentStateOfRepo(localProject.directoryName, localProject.commitSha, localProject.status);
            }
            const repository = await Repository.open(`${this.appSettings.rootFolder}\\${localProject.directoryName}`);
            const currentBranch = await repository.getCurrentBranch();
            await repository.checkoutBranch('master');
            const remote = await repository.getRemote('origin');
            await repository.fetch(remote, {
                callbacks: {
                    credentials: this.GitCredentialsFunction,
                },
                certificateCheck: () => 1,
            } as FetchOptions);
            await repository.mergeBranches('master', 'refs/remotes/origin/master', repository.defaultSignature(), Merge.PREFERENCE.FASTFORWARD_ONLY);
            if (currentBranch.name() !== 'refs/heads/master') {
                await repository.checkoutBranch(currentBranch.name());
            }
            if (changesStashed) {
                await this.PopCurrentStateOfRepo(localProject.directoryName, localProject.commitSha, localProject.status);
            }
        } catch (error) {
            ApplicationLogger.logError(`Failed to update ${localProject.directoryName}`, error);
            ApplicationLogger.logError(error.message, error);
            return error;
        }

        return true;
    }

    private async PopCurrentStateOfRepo(directoryName: string, _: string, __: LocalFileStatus[]): Promise<boolean> {
        const repository = await Repository.open(`${this.appSettings.rootFolder}\\${directoryName}`);
        let result = false;

        try {
            await Stash.pop(repository, 0);

            const index = await repository.refreshIndex();
            // const commit = await repository.getCommit(currentCommitSha);
            // const options = {
            //     paths: changes.filter(lfs => lfs.isNew).map(lfs => lfs.path),
            // } as CheckoutOptions;
            // const obj = await Commit.lookup(repository, commit.id());
            // await Reset.default(repository, obj, options.paths || []);
            await index.write();
            result = true;
        } catch (error) {
            ApplicationLogger.logError(error.message, error);
        }

        return result;
    }

    private async StashCurrentStateOfRepo(directoryName: string, currentCommitSha: string, changes: LocalFileStatus[]): Promise<boolean> {
        const repository = await Repository.open(`${this.appSettings.rootFolder}\\${directoryName}`);
        let result = false;

        const index = await repository.refreshIndex();
        try {
            await asyncForEach(changes, async (lfs: LocalFileStatus) => {
                if (lfs.isNew) {
                    await index.addByPath(lfs.path);
                }
            });
            await index.write();
            await Stash.save(repository, repository.defaultSignature(), ``, 0);
            result = true;
        } catch (error) {
            ApplicationLogger.logError(error.message, error);
            const commit = await repository.getCommit(currentCommitSha);
            const annotatedCommit = await AnnotatedCommit.lookup(repository, commit.id());
            const options = {
                paths: changes.filter(lfs => !lfs.inIndex).map(lfs => lfs.path),
            } as CheckoutOptions;
            await Reset.fromAnnotated(repository, annotatedCommit, Reset.TYPE.HARD, options);
            await index.write();
        }

        return result;
    }

    private ConvertStatusObjects(statusFiles: StatusFile[]): LocalFileStatus[] {
        return statusFiles.map(
            sf =>
                ({
                    inIndex: sf.inIndex(),
                    inWorkingTree: sf.inWorkingTree(),
                    isConflicted: sf.isConflicted(),
                    isDeleted: sf.isDeleted(),
                    isIgnored: sf.isIgnored(),
                    isModified: sf.isModified(),
                    isNew: sf.isNew(),
                    isRenamed: sf.isRenamed(),
                    isTypechange: sf.isTypechange(),
                    path: sf.path(),
                    status: sf.status(),
                    statusBit: sf.statusBit(),
                } as LocalFileStatus),
        );
    }

    private async GetAllDirectoriesInLocalFolder(): Promise<string[]> {
        const dirs = await fs.readdir(this.appSettings.rootFolder);
        return dirs;
    }

    private GitCredentialsFunction = (url: string, userName: string): Cred => {
        if (url.startsWith(HTTP_URL_PREFIX)) {
            return Cred.userpassPlaintextNew(this.userSettings.gitlabUsername, this.userSettings.gitlabPassword);
        } else {
            const creds = Cred.sshKeyNew(
                userName,
                `${this.homeFolder}${SSH_PUBLIC_KEY_FILE}`, `${this.homeFolder}${SSH_PRIVATE_KEY_FILE}`, SSH_ENCRYPTION_PASSPHRASE);
            return creds;
        }
    }

    private CloneOptions = (): CloneOptions => {
        return {
            fetchOpts: {
                callbacks: {
                    credentials: this.GitCredentialsFunction,
                },
                certificateCheck: () => 1,
            } as FetchOptions
        };
    }
}
