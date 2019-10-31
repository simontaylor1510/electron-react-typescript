import { LocalProject } from '../localProject';

export interface OutOfDateProjectsProps {
    refreshingOutOfDateProjects: boolean;
    refreshingProject: string | null;
    lastRefreshedProject: string | null;
    nextProjectToRefresh: string | null;
    outOfDateProjects: LocalProject[];
    serverFetchError: Error | null;
    updateLocalProject: (projectLocation: string, updateAll: boolean) => void;
}