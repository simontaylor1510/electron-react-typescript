import { LocalProject } from '../localProject';

export interface UnpushedProjectsProps {
    pushingProjects: boolean;
    pushingProject: string | null;
    lastPushedProject: string | null;
    nextProjectToPush: string | null;
    unpushedProjects: LocalProject[];
    serverFetchError: Error | null;
    pushLocalProject: (projectLocation: string, pushAll: boolean) => void;
}