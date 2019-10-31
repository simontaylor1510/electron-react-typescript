import { Project } from '../project';

export interface NewProjectsProps {
    cloneGitlabProject: (url: string, cloningAll: boolean) => void;
    cloningNewProjects: boolean;
    cloningProject: string | null;
    lastClonedProject: string | null;
    newProjects: Project[];
    nextProjectToClone: string | null;
    serverFetchError: Error | null;
}