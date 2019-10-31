import { Dispatch } from 'redux';

export { ApplicationActionsEnum } from './applicationEnums';
import { configureApplicationActions } from './application';

export { BuildsActionsEnum } from './buildEnums';

import { configureBuildsActions } from './builds';
export {
    GetFailedBuilds
} from './builds';

export { ProjectsActionsEnum } from './projectEnums';

import { configureProjectsActions } from './projects';
export {
    GetAllProjects,
    GetAllLocalProjects,
    DeleteUntrackedFilesForLocalProject,
    DiscardSelectedChangesForLocalProject,
    SetProjectsFilter,
    CheckoutMasterBranchForLocalProject
} from './projects';

export { SettingsActionsEnum } from './settingsEnums';

import { configureSettingsActions } from './settings';

export { NuGetPackageSourceActionsEnum } from './nugetPackageSourceEnums';

export { onApiResponse } from './apiClient';

export function configureActions(dispatch: Dispatch) {
    configureApplicationActions(dispatch);
    configureBuildsActions(dispatch);
    configureProjectsActions(dispatch);
    configureSettingsActions(dispatch);
}