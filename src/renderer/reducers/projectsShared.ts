import { ProjectsActions } from '../actions/projects';
import { ProjectsActionsEnum } from '../actions/projectEnums';
import {
    ProjectsSharedState,
    LocalFileStatus,
    LocalProject,
    Project,
    LocalProjectStatusTypeEnum,
    Commit
} from '../types';
import {
    ProjectsDeprecatedProjectsState,
    ProjectsDirtyProjectsState,
    ProjectsNewProjectsState,
    ProjectsOutOfDateProjectsState
} from '../types/state/projects';
import { ReceiveLocalProjectStatusAction } from '../actions/projects';

const initialState: ProjectsSharedState = {
    allLocalProjects: [],
    allProjects: [],
    cleaningProject: null,
    deprecatedProjects: {
        deprecatedProjects: [],
        lastRemovedProject: null,
        nextProjectToRemove: null,
        removingDeprecatedProjects: false,
        removingProject: null,
    } as ProjectsDeprecatedProjectsState,
    didInvalidate: false,
    dirtyProjects: {
        cleaningProject: null,
        dirtyProjects: [],
    } as ProjectsDirtyProjectsState,
    filteredLocalProjects: [],
    filteredProjects: [],
    isFetchingFromServer: false,
    isFetchingLocal: false,
    lastLocalUpdate: null,
    lastServerUpdate: null,
    localFetchError: null,
    localProgress: 0,
    newProjects: {
        cloningNewProjects: false,
        cloningProject: null,
        lastClonedProject: null,
        newProjects: [],
        nextProjectToClone: null,
    } as ProjectsNewProjectsState,
    outOfDateProjects: {
        lastRefreshedProject: null,
        nextBackgroundProjectToRefresh: null,
        nextProjectToRefresh: null,
        outOfDateProjects: [],
        refreshingOutOfDateProjects: false,
        refreshingOutOfDateProjectsInBackground: false,
        refreshingProject: null,
    } as ProjectsOutOfDateProjectsState,
    projectFilters: ['Libraries', 'Applications', 'Services', 'PerfTests', 'ThirdParty', 'Inventory', 'Utility'],
    projectsNotOnTheMasterBranch: {
        projectsNotOnTheMasterBranch: [],
    },
    serverFetchError: null,
    unpushedProjects: {
        lastPushedProject: null,
        nextProjectToPush: null,
        pushingProject: null,
        pushingProjects: false,
        unpushedProjects: [],
    },
};

export function projects(state: ProjectsSharedState = initialState, action: ProjectsActions) {
    let filteredProjects: Project[];
    let filteredLocalProjects: LocalProject[];
    let deprecatedProjects: LocalProject[];
    let dirtyProjects: LocalProject[];
    let newProjects: Project[];
    let outOfDateProjects: LocalProject[];
    let newState: ProjectsSharedState;

    switch (action.type) {
        case ProjectsActionsEnum.RequestAllProjects:
            return {
                ...state,
                isFetchingFromServer: true,
                serverFetchError: null,
            };

        case ProjectsActionsEnum.RequestAllProjectsError:
            return {
                ...state,
                isFetchingFromServer: false,
                serverFetchError: action.error,
            };

        case ProjectsActionsEnum.ReceiveAllProjects:
            newState = generateCombinedStateObjectForUpdatedProjectsOrLocalProjects(
                state.allLocalProjects,
                action.data,
                state,
                LocalProjectStatusTypeEnum.None,
                false,
                '',
                false);

            return {
                ...newState,
                isFetchingFromServer: false,
                lastServerUpdate: new Date(),
            };

        case ProjectsActionsEnum.ReceiveSingleProject:
            const allProjects = state.allProjects.filter(p => p.id !== action.project.id);
            allProjects.push(action.project);

            newState = generateCombinedStateObjectForUpdatedProjectsOrLocalProjects(
                state.filteredLocalProjects,
                allProjects,
                state,
                LocalProjectStatusTypeEnum.None,
                false,
                '',
                false,
            );

            return {
                ...newState,
            };

        case ProjectsActionsEnum.RequestAllLocalProjects:
            return {
                ...state,
                isFetchingLocal: true,
                localFetchError: null,
            };

        case ProjectsActionsEnum.RequestAllLocalProjectsError:
            return {
                ...state,
                isFetchingLocal: false,
                localFetchError: action.error,
            };

        case ProjectsActionsEnum.ReceiveAllLocalProjects:
            newState = generateCombinedStateObjectForUpdatedProjectsOrLocalProjects(
                action.data,
                state.allProjects,
                state,
                LocalProjectStatusTypeEnum.None,
                false,
                '',
                false);

            return {
                ...newState,
                isFetchingLocal: false,
                lastLocalUpdate: new Date(),
            };

        case ProjectsActionsEnum.ReceiveAllLocalProjectsProgress:
            return {
                ...state,
                // tslint:disable-next-line: max-line-length
                localProgress: Number.parseInt((((action.progress.actualCount + action.progress.skippedCount) / action.progress.expectedCount) * 100).toFixed(2), 10),
            };

        case ProjectsActionsEnum.RequestSingleLocalProjectStatusError:
            return {
                ...state,
            };

        case ProjectsActionsEnum.LocalProjectStatus:
            return generateStateFromActionResult(state, action);

        case ProjectsActionsEnum.SetProjectsFilter:
            filteredLocalProjects = state.allLocalProjects.filter(lp => isProjectInFilters(lp, action.filters));
            filteredProjects = state.allProjects.filter(p => isProjectInFilters(p, action.filters));
            deprecatedProjects = generateDeprecatedProjects(filteredProjects, filteredLocalProjects);
            dirtyProjects = generateProjectsWithChanges(filteredLocalProjects);
            newProjects = generateNewProjects(filteredProjects, filteredLocalProjects);
            outOfDateProjects = generateOutOfDateProjects(filteredProjects, filteredLocalProjects);

            return {
                ...state,
                deprecatedProjects: {
                    ...state.deprecatedProjects,
                    deprecatedProjects,
                },
                dirtyProjects: {
                    ...state.dirtyProjects,
                    dirtyProjects,
                },
                filteredLocalProjects,
                filteredProjects,
                newProjects: {
                    ...state.newProjects,
                    newProjects,
                },
                outOfDateProjects: {
                    ...state.outOfDateProjects,
                    outOfDateProjects,
                },
                projectFilters: action.filters,
            };

        case ProjectsActionsEnum.RemoveLocalProject:
            return {
                ...state,
                deprecatedProjects: {
                    ...state.deprecatedProjects,
                    removingDeprecatedProjects: action.removeAll,
                    removingProject: action.directoryName,
                },
            };

        case ProjectsActionsEnum.RemoveLocalProjectError:
            return {
                ...state,
                deprecatedProjects: {
                    ...state.deprecatedProjects,
                    removingDeprecatedProjects: action.removingAll,
                    removingProject: null,
                },
            };

        case ProjectsActionsEnum.UpdateLocalProject:
            return {
                ...state,
                outOfDateProjects: {
                    ...state.outOfDateProjects,
                    refreshingOutOfDateProjects: action.updateAll && !action.background,
                    refreshingOutOfDateProjectsInBackground: action.updateAll && action.background,
                    refreshingProject: action.directoryName,
                },
            };

        case ProjectsActionsEnum.UpdateLocalProjectError:
            return {
                ...state,
                outOfDateProjects: {
                    ...state.outOfDateProjects,
                    refreshingOutOfDateProjects: false,
                    refreshingOutOfDateProjectsInBackground: false,
                    refreshingProject: null,
                },
            };

        case ProjectsActionsEnum.CheckoutLocalProject:
            return {
                ...state,
                newProjects: {
                    ...state.newProjects,
                    cloningNewProjects: action.checkoutAll,
                    cloningProject: action.url,
                },
            };

        case ProjectsActionsEnum.CheckoutLocalProjectError:
            return {
                ...state,
                newProjects: {
                    ...state.newProjects,
                    cloningNewProjects: action.checkingOutAll,
                    cloningProject: null,
                },
            };

        case ProjectsActionsEnum.CleanLocalProjectFolder:
            return {
                ...state,
                cleaningProject: action.directoryName,
                dirtyProjects: {
                    ...state.dirtyProjects,
                    cleaningProject: action.directoryName
                }
            };

        case ProjectsActionsEnum.CleanLocalProjectFolderError:
            return {
                ...state,
                cleaningProject: null
            };

        default:
            return state;
    }
}

function generateCombinedStateObjectForUpdatedProjectsOrLocalProjects(
    allLocalProjects: LocalProject[],
    allProjects: Project[],
    state: ProjectsSharedState,
    statusType: LocalProjectStatusTypeEnum,
    batchOperation: boolean,
    lastBatchOperationItem: string | null,
    background: boolean,
) {
    const filteredLocalProjects = allLocalProjects.filter(lp => isProjectInFilters(lp, state.projectFilters));
    const filteredProjects = allProjects.filter(p => isProjectInFilters(p, state.projectFilters));

    const deprecatedProjects = generateDeprecatedProjects(filteredProjects, filteredLocalProjects);
    const dirtyProjects = generateProjectsWithChanges(filteredLocalProjects);
    const newProjects = generateNewProjects(filteredProjects, filteredLocalProjects);
    const outOfDateProjects = generateOutOfDateProjects(filteredProjects, filteredLocalProjects);
    const projectsNotOnTheMasterBranch = generateProjectsNotOnTheMasterBranch(filteredLocalProjects);
    const unpushedProjects = generateUnpushedProjects(filteredProjects, filteredLocalProjects);

    const newState = {
        ...state,
        allLocalProjects,
        allProjects,
        cleaningProject: statusType === LocalProjectStatusTypeEnum.Cleaning ? null : state.cleaningProject,
        deprecatedProjects: {
            ...state.deprecatedProjects,
            deprecatedProjects,
            lastRemovedProject: statusType === LocalProjectStatusTypeEnum.Removing ?
                lastBatchOperationItem :
                state.deprecatedProjects.lastRemovedProject,
            nextProjectToRemove: getNextLocalProjectItem(deprecatedProjects, lastBatchOperationItem, background),
            removingDeprecatedProjects: statusType === LocalProjectStatusTypeEnum.Removing ?
                batchOperation :
                state.deprecatedProjects.removingDeprecatedProjects,
            removingProject: statusType === LocalProjectStatusTypeEnum.Removing ? null : state.deprecatedProjects.removingProject,
        },
        dirtyProjects: {
            ...state.dirtyProjects,
            cleaningProject: statusType === LocalProjectStatusTypeEnum.Cleaning ? null : state.dirtyProjects.cleaningProject,
            dirtyProjects,
        },
        filteredLocalProjects,
        filteredProjects,
        newProjects: {
            ...state.newProjects,
            cloningNewProjects: statusType === LocalProjectStatusTypeEnum.Cloning ? batchOperation : state.newProjects.cloningNewProjects,
            cloningProject: statusType === LocalProjectStatusTypeEnum.Cloning ? null : state.newProjects.cloningProject,
            lastClonedProject: statusType === LocalProjectStatusTypeEnum.Cloning ? lastBatchOperationItem : state.newProjects.lastClonedProject,
            newProjects,
            nextProjectToClone: getNextProjectItem(newProjects, lastBatchOperationItem),
        },
        outOfDateProjects: {
            ...state.outOfDateProjects,
            lastRefreshedProject: statusType === LocalProjectStatusTypeEnum.Updating ?
                lastBatchOperationItem :
                state.outOfDateProjects.lastRefreshedProject,
            nextBackgroundProjectToRefresh: getNextLocalProjectItem(outOfDateProjects, lastBatchOperationItem, true),
            nextProjectToRefresh: getNextLocalProjectItem(outOfDateProjects, lastBatchOperationItem, false),
            outOfDateProjects,
            refreshingOutOfDateProjects: statusType === LocalProjectStatusTypeEnum.Updating ? batchOperation && !background : state.outOfDateProjects.refreshingOutOfDateProjects,
            refreshingOutOfDateProjectsInBackground: statusType === LocalProjectStatusTypeEnum.Updating ? batchOperation && background : state.outOfDateProjects.refreshingOutOfDateProjectsInBackground,
            refreshingProject: statusType === LocalProjectStatusTypeEnum.Updating ? null : state.outOfDateProjects.refreshingProject,
        },
        projectsNotOnTheMasterBranch: {
            ...state.projectsNotOnTheMasterBranch,
            projectsNotOnTheMasterBranch,
        },
        unpushedProjects: {
            ...state.unpushedProjects,
            unpushedProjects,
        },
    };

    if (newState.deprecatedProjects.deprecatedProjects.length === 0) {
        if (newState.deprecatedProjects.removingDeprecatedProjects) {
            newState.deprecatedProjects.removingDeprecatedProjects = false;
        }
    }
    if (newState.newProjects.newProjects.length === 0) {
        if (newState.newProjects.cloningNewProjects) {
            newState.newProjects.cloningNewProjects = false;
        }
    }
    if (newState.outOfDateProjects.outOfDateProjects.length === 0) {
        if (newState.outOfDateProjects.refreshingOutOfDateProjects) {
            newState.outOfDateProjects.refreshingOutOfDateProjects = false;
        }
        if (newState.outOfDateProjects.refreshingOutOfDateProjectsInBackground) {
            newState.outOfDateProjects.refreshingOutOfDateProjectsInBackground = false;
        }
    }

    return newState;
}

function generateStateFromActionResult(state: ProjectsSharedState, action: ReceiveLocalProjectStatusAction) {
    let projectsAfterUpdate: LocalProject[] = [];
    if (action.statusType !== LocalProjectStatusTypeEnum.Removing && action.statusType !== LocalProjectStatusTypeEnum.Deleted) {
        if (action.localProject !== null) {
            projectsAfterUpdate = replaceLocalProjectInArray(state, action.localProject);
            projectsAfterUpdate = projectsAfterUpdate.sort((p1, p2) => p1.name.localeCompare(p2.name));
        } else {
            projectsAfterUpdate = state.allLocalProjects;
        }
    } else {
        if (action.lastBatchOperationItem !== null && action.lastBatchOperationItem !== '') {
            projectsAfterUpdate = state.allLocalProjects.filter(lp => lp.directoryName !== action.lastBatchOperationItem);
        } else {
            const directoryName = action.localProject !== null ? action.localProject.directoryName : '';
            if (action.localProject !== null && action.localProject.directoryName !== null) {
                projectsAfterUpdate = state.allLocalProjects.filter(lp => lp.directoryName !== directoryName);
            }
        }
    }

    return generateCombinedStateObjectForUpdatedProjectsOrLocalProjects(
        projectsAfterUpdate,
        state.allProjects,
        state,
        action.statusType,
        action.batchOperation,
        action.lastBatchOperationItem,
        action.background,
    );
}

function isProjectInFilters(localProject: LocalProject | Project, filters: string[]): boolean {
    const name = localProject.name.toLocaleLowerCase();
    if (name.startsWith('application.') && !name.endsWith('.performancetests') && filters.indexOf('Applications') >= 0) {
        return true;
    }
    if (name.startsWith('service.') && !name.endsWith('.performancetests') && filters.indexOf('Services') >= 0) {
        return true;
    }
    if (name.startsWith('library.') && filters.indexOf('Libraries') >= 0) {
        return true;
    }
    if (name.startsWith('service.') && name.endsWith('.performancetests') && filters.indexOf('PerfTests') >= 0) {
        return true;
    }
    if (name.startsWith('thirdparty.') && filters.indexOf('ThirdParty') >= 0) {
        return true;
    }
    if (name.startsWith('utility.deploy.') && filters.indexOf('Inventory') >= 0) {
        return true;
    }
    if (name.startsWith('utility.') && !name.startsWith('utility.deploy') && filters.indexOf('Utility') >= 0) {
        return true;
    }

    return false;
}

function generateProjectsWithChanges(filteredProjects: LocalProject[]): LocalProject[] {
    return filteredProjects.filter(p => p.status.length !== 0).sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function generateOutOfDateProjects(filteredProjects: Project[], filteredLocalProjects: LocalProject[]): LocalProject[] {
    const serverShas = new Map<string, Commit>();
    filteredProjects.filter(sp => sp.last_commit).map(sp => serverShas.set(sp.name, sp.last_commit));
    const results: LocalProject[] = [];

    filteredLocalProjects.forEach(lp => {
        const sp = serverShas.get(lp.name);
        lp.unpulledRemoteCommits = sp !== undefined && !lp.localCommits.find(lc => lc === sp.id);
        if (lp.unpulledRemoteCommits && lp.status.length === 0) {
            if (sp) {
                lp.lastServerCommit = sp;
            }
            results.push(lp);
        }
    });

    return results.sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function generateProjectsNotOnTheMasterBranch(filteredLocalProjects: LocalProject[]): LocalProject[] {
    const results: LocalProject[] = [];

    filteredLocalProjects.forEach(lp => {
        if (lp.status.length === 0 && lp.currentBranch !== 'refs/heads/master') {
            results.push(lp);
        }
    });

    return results.sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function generateUnpushedProjects(_: Project[], filteredLocalProjects: LocalProject[]): LocalProject[] {
    const results: LocalProject[] = [];

    filteredLocalProjects.forEach(lp => {
        if (lp.ahead > 0) {
            results.push(lp);
        }
    });

    return results.sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function generateNewProjects(serverProjects: Project[], localProjects: LocalProject[]): Project[] {
    const localProjectNames = localProjects.map(p => p.name.toLocaleLowerCase());
    const results: Project[] = [];

    serverProjects.forEach(sp => {
        if (localProjectNames.indexOf(sp.name.toLocaleLowerCase()) < 0) {
            results.push(sp);
        }
    });

    return results.sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function generateDeprecatedProjects(serverProjects: Project[], localProjects: LocalProject[]): LocalProject[] {
    const serverProjectNames = serverProjects.map(p => p.name.toLocaleLowerCase());
    const results: LocalProject[] = [];

    localProjects.forEach(lp => {
        if (serverProjectNames.indexOf(lp.name.toLocaleLowerCase()) < 0) {
            results.push(lp);
        }
    });

    return results.sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function getNextProjectItem(items: Project[], currentItem: string | null): string | null {
    const nextItems = items.filter(i => i.http_url_to_repo !== currentItem);
    if (nextItems.length > 0) {
        return nextItems[0].http_url_to_repo;
    }

    return null;
}

function getNextLocalProjectItem(items: LocalProject[], currentItem: string | null, background: boolean): string | null {
    const nextItems = items.filter(i => i.directoryName !== currentItem && (!background || i.status.length === 0));
    if (nextItems.length > 0) {
        return nextItems[0].directoryName;
    }

    return null;
}

function replaceLocalProjectInArray(state: ProjectsSharedState, localProject: LocalProject): LocalProject[] {
    const projectToReplace = state.allLocalProjects.find(lp => lp.directoryName === localProject.directoryName);
    let selected = [] as LocalFileStatus[];
    if (projectToReplace) {
        selected = projectToReplace.status.filter(lfs => lfs.isSelected);
    }
    const projectsAfterUpdate = state.allLocalProjects.filter(lp => lp.directoryName !== localProject.directoryName);
    selected.forEach(lfs => {
        const matchingItem = localProject.status.find(mi => mi.path === lfs.path);
        if (matchingItem) {
            matchingItem.isSelected = true;
        }
    });
    projectsAfterUpdate.push(localProject);

    return projectsAfterUpdate;
}

export default projects;
