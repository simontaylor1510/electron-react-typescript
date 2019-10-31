import { Project, LocalProject } from '..';

export interface ProjectsSharedProps {
    allLocalProjects: LocalProject[];
    allProjects: Project[];
    cleaningProject: string | null;
    cleanLocalProjectFolder: (projectLocation: string) => void;
    deprecatedProjectsCount: number;
    dirtyProjectsCount: number;
    filteredLocalProjects: LocalProject[];
    filteredProjects: Project[];
    isFetchingFromServer: boolean;
    isFetchingLocal: boolean;
    lastLocalUpdate: Date | null;
    lastServerUpdate: Date | null;
    localFetchError: Error | null;
    localProgress: number;
    localProjectsRequested: boolean;
    newProjectsCount: number;
    outOfDateProjectsCount: number;
    projectFilters: string[];
    projectsNotOnTheMasterBranchCount: number;
    refreshingOutOfDateProjects: boolean;
    refreshingProject: string | null;
    requestAllLocalProjects: () => void;
    requestAllProjects: () => void;
    requestSingleLocalProjectStatus: (projectLocation: string) => void;
    serverFetchError: Error | null;
    setProjectsFilter: (filters: string[]) => void;
    updateLocalProject: (projectLocation: string, updateAll: boolean) => void;
    unpushedProjectsCount: number;
}
