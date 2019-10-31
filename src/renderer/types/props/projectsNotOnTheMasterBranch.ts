import { LocalProject } from '../localProject';

export interface ProjectsNotOnTheMasterBranchProps {
    checkoutMasterBranchForLocalProject: (directoryName: string) => void;
    projectsNotOnTheMasterBranch: LocalProject[];
    serverFetchError: Error | null;
}