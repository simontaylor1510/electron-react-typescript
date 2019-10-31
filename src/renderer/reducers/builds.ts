import { BuildsActions, UnseenBuildCountUpdatedAction } from '../actions/builds';
import { BuildsActionsEnum } from '../actions/buildEnums';
import { BuildsState, TeamCityBuild } from '../types';
import { ReceiveFailedBuildsAction } from '../actions/builds';

const initialState: BuildsState = {
    didInvalidate: false,
    failedBuilds: [] as TeamCityBuild[],
    fetchError: null,
    isFetching: false,
    revisedCredentialsValid: false,
    unseenCount: 0
};

export function builds(state: BuildsState = initialState, action: BuildsActions) {
    switch (action.type) {
        case BuildsActionsEnum.RequestFailedBuilds:
            return {
                ...state,
                fetchError: null,
                isFetching: true
            };

        case BuildsActionsEnum.RequestFailedBuildsError:
            return {
                ...state,
                fetchError: action.error,
                isFetching: false
            };

        case BuildsActionsEnum.FailedBuildsResult:
            const failedBuildsAction = action as ReceiveFailedBuildsAction;
            return {
                ...state,
                failedBuilds: failedBuildsAction.data,
                isFetching: false
            };

        case BuildsActionsEnum.ResetUnseenCount:
            return {
                ...state,
                unseenCount: 0
            };

        case BuildsActionsEnum.UnseenCountUpdated:
            const unseenCountUpdatedAction = action as UnseenBuildCountUpdatedAction;
            return {
                ...state,
                unseenCount: unseenCountUpdatedAction.count
            };

        default:
            return state;
    }
}

export default builds;