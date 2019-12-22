import { Project, LocalProject } from '..';

export interface ProjectSelectorProps {
    allProjects: Project[];
    allLocalProjects: LocalProject[];
    dirtyProjects: LocalProject[];
    newProjects: Project[];
    openTerminals: Map<string, number>;
    outOfDateProjects: LocalProject[];
    repoSelected: (repo: string) => void;
    openTerminal: () => void;
}