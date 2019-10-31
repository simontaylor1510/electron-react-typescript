import { Dispatch, Action } from 'redux';

import { sendApiRequest, onApiResponse } from './apiClient';

import { BuildsActionsEnum } from './buildEnums';
import { TeamCityBuild } from '../types';

export interface RequestFailedBuildsAction extends Action {
    readonly type: typeof BuildsActionsEnum.RequestFailedBuilds;
}

export interface RequestFailedBuildsErrorAction extends Action {
    readonly type: typeof BuildsActionsEnum.RequestFailedBuildsError;
    readonly error: Error;
}

export interface ReceiveFailedBuildsAction extends Action {
    readonly type: typeof BuildsActionsEnum.FailedBuildsResult;
    readonly data: TeamCityBuild[];
}

export interface ResetUnseenFailedBuildCountAction extends Action {
    readonly type: typeof BuildsActionsEnum.ResetUnseenCount;
}

export interface UnseenBuildCountUpdatedAction extends Action {
    readonly count: number;
    readonly type: typeof BuildsActionsEnum.UnseenCountUpdated;
}

export type BuildsActions = RequestFailedBuildsAction | RequestFailedBuildsErrorAction | ReceiveFailedBuildsAction |
    ResetUnseenFailedBuildCountAction | UnseenBuildCountUpdatedAction;

function requestFailedBuilds(): RequestFailedBuildsAction {
    return {
        type: BuildsActionsEnum.RequestFailedBuilds
    };
}

function requestFailedBuildsError(error: Error): RequestFailedBuildsErrorAction {
    return {
        error,
        type: BuildsActionsEnum.RequestFailedBuildsError
    };
}

function receiveFailedBuilds(data: TeamCityBuild[]): ReceiveFailedBuildsAction {
    return {
        data,
        type: BuildsActionsEnum.FailedBuildsResult
    };
}

function resetUnseenFailedBuildCount(): ResetUnseenFailedBuildCountAction {
    return {
        type: BuildsActionsEnum.ResetUnseenCount
    };
}

function unseenFailedBuildsCountReset(count: number): UnseenBuildCountUpdatedAction {
    return {
        count,
        type: BuildsActionsEnum.UnseenCountUpdated
    };
}

export const GetFailedBuilds = (dispatch: Dispatch) => {
    dispatch(requestFailedBuilds());
    sendApiRequest(BuildsActionsEnum.RequestFailedBuilds);
};

export const ResetUnseenCount = (dispatch: Dispatch) => {
    dispatch(resetUnseenFailedBuildCount());
    sendApiRequest(BuildsActionsEnum.ResetUnseenCount);
};

export function configureBuildsActions(dispatch: Dispatch) {
    onApiResponse(BuildsActionsEnum.FailedBuildsResult, (data: TeamCityBuild[]) => {
        dispatch(receiveFailedBuilds(data));
    });
    onApiResponse(BuildsActionsEnum.RequestFailedBuildsError, (error: Error) => {
        dispatch(requestFailedBuildsError(error));
    });
    onApiResponse(BuildsActionsEnum.UnseenCountUpdated, (count: number) => {
        dispatch(unseenFailedBuildsCountReset(count));
    });
}