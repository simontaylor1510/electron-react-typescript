import { LocalProject } from '../localProject';

export interface DeprecatedProjectsProps {
    deprecatedProjects: LocalProject[];
    lastRemovedProject: string | null;
    nextProjectToRemove: string | null;
    removeLocalProject: (projectLocation: string, removeAll: boolean) => void;
    removingDeprecatedProjects: boolean;
    removingProject: string | null;
    serverFetchError: Error | null;
}