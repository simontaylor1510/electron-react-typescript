import { Project, LocalProject } from '..';

export interface ProjectSelectorProps {
    allProjects: Project[];
    allLocalProjects: LocalProject[];
    repoSelected: (repo: string) => void;
    openTerminal: () => void;
}