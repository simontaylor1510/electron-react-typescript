import { LocalProject } from '..';

export interface DirtyProjectsProps {
    cleaningProject: string | null;
    cleanLocalProjectFolder: (directoryName: string) => void;
    deleteUntrackedFilesForLocalProject: (localProject: LocalProject) => void;
    discardSelectedChangesForLocalProject: (localProject: LocalProject) => void;
    dirtyProjects: LocalProject[];
    openTortoiseGit: (directoryName: string) => void;
    serverFetchError: Error | null;
    updateLocalProjectFolder: (directoryName: string) => void;
    updatingProject: string | null;
}