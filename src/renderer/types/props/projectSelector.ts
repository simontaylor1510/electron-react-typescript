import { Project, LocalProject } from '..';

export interface ProjectSelectorProps {
    allProjects: Project[];
    allLocalProjects: LocalProject[];
    openTerminals: Map<string, number>;
    repoSelected: (repo: string) => void;
    openTerminal: () => void;
}