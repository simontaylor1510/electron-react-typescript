import { BuildsState } from './state/builds';
import { ProjectsSharedState } from './state/projects';
import { SettingsState } from './state/settings';
import { ApplicationState } from './state/application';

export { ApplicationState } from './state/application';

export { BuildsState } from './state/builds';
export { FailedBuildsProps } from './props/failedBuilds';

export { Project } from './project';

export { Commit } from './commit';

export { ApplicationProps } from './props/application';

export { AppSettings } from './appSettings';

export { LocalProject } from './localProject';

export { LocalFileStatus } from './localFileStatus';

export { LocalProjectStatusTypeEnum } from './localProjectStatus';

export { ProjectsSharedState } from './state/projects';
export { ProjectsSharedProps } from './props/projectsShared';
export { DeprecatedProjectsProps } from './props/deprecatedProjects';
export { DirtyProjectsProps } from './props/dirtyProjects';
export { NewProjectsProps } from './props/newProjects';
export { OutOfDateProjectsProps } from './props/outOfDateProjects';
export { ProjectsNotOnTheMasterBranchProps } from './props/projectsNotOnTheMasterBranch';
export { UnpushedProjectsProps } from './props/unpushedProjects';
export { OverviewProps } from './props/overviewProps';
export { ProjectSelectorProps } from './props/projectSelector'

export { TeamCityBuild } from './teamCityBuild';

export { Progress } from './progress';

export { IpcPayload } from './ipc';

export { UserDetailsApiCall } from './state/settings';
export { UserDetailsProps } from './props/userDetails';
export { UpdatedSettings } from './updatedSettings';

export { NuGetPackageDetails } from './nuGetPackageDetails';

export { OnlineState } from './onlineState';

export interface GlobalState {
    application: ApplicationState;
    builds: BuildsState;
    projects: ProjectsSharedState;
    settings: SettingsState;
}