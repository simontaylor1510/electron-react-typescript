import { Project } from '../project';
import { LocalProject } from '../localProject';

export interface ProjectsSharedState {
    allProjects: Project[];
    allLocalProjects: LocalProject[];
    cleaningProject: string | null;
    deprecatedProjects: ProjectsDeprecatedProjectsState;
    didInvalidate: boolean;
    dirtyProjects: ProjectsDirtyProjectsState;
    filteredLocalProjects: LocalProject[];
    filteredProjects: Project[];
    isFetchingLocal: boolean;
    isFetchingFromServer: boolean;
    lastLocalUpdate: Date | null;
    lastServerUpdate: Date | null;
    localFetchError: Error | null;
    localProgress: number;
    newProjects: ProjectsNewProjectsState;
    outOfDateProjects: ProjectsOutOfDateProjectsState;
    projectFilters: string[];
    projectsNotOnTheMasterBranch: ProjectsNotOnTheMasterBranch;
    serverFetchError: Error | null;
    unpushedProjects: ProjectsUnpushedProjectsState;
}

export interface ProjectsDirtyProjectsState {
    cleaningProject: string | null;
    dirtyProjects: LocalProject[];
}

export interface ProjectsOutOfDateProjectsState {
    lastRefreshedProject: string | null;
    nextBackgroundProjectToRefresh: string | null;
    nextProjectToRefresh: string | null;
    outOfDateProjects: LocalProject[];
    refreshingOutOfDateProjects: boolean;
    refreshingOutOfDateProjectsInBackground: boolean;
    refreshingProject: string | null;
}

export interface ProjectsNotOnTheMasterBranch {
    projectsNotOnTheMasterBranch: LocalProject[];
}

export interface ProjectsNewProjectsState {
    cloningNewProjects: boolean;
    cloningProject: string | null;
    lastClonedProject: string | null;
    newProjects: Project[];
    nextProjectToClone: string | null;
}

export interface ProjectsDeprecatedProjectsState {
    deprecatedProjects: LocalProject[];
    lastRemovedProject: string | null;
    nextProjectToRemove: string | null;
    removingDeprecatedProjects: boolean;
    removingProject: string | null;
}

export interface ProjectsUnpushedProjectsState {
    lastPushedProject: string | null;
    nextProjectToPush: string | null;
    pushingProjects: boolean;
    pushingProject: string | null;
    unpushedProjects: LocalProject[];
}
