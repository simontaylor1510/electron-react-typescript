import { Dispatch, Action } from 'redux';

import { sendApiRequest, onApiResponse } from './apiClient';
import { Project, LocalProject, Progress, LocalProjectStatusTypeEnum } from '../types';
import { LocalProjectStatusResult } from '../types/localProjectStatus';
import { ProjectsActionsEnum } from './projectEnums';

export interface RequestProjectsAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RequestAllProjects;
}

export interface RequestProjectsErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RequestAllProjectsError;
    readonly error: Error;
}

export interface ReceiveProjectsAction extends Action {
    readonly type: typeof ProjectsActionsEnum.ReceiveAllProjects;
    readonly data: Project[];
}

export interface ReceiveSingleProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.ReceiveSingleProject;
    readonly project: Project;
}

export interface ReceiveProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.ReceiveSingleProject;
    readonly project: Project;
}

export interface RequestAllLocalProjectsAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RequestAllLocalProjects;
}

export interface RequestAllLocalProjectsErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RequestAllLocalProjectsError;
    readonly error: Error;
}

export interface ReceiveAllLocalProjectsAction extends Action {
    readonly type: typeof ProjectsActionsEnum.ReceiveAllLocalProjects;
    readonly data: LocalProject[];
}

export interface ReceiveAllLocalProjectsProgressAction extends Action {
    readonly type: typeof ProjectsActionsEnum.ReceiveAllLocalProjectsProgress;
    readonly progress: Progress;
}

export interface RequestSingleLocalProjectStatusAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RequestSingleLocalProjectStatus;
    readonly projectLocation: string;
}

export interface RequestSingleLocalProjectStatusErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RequestSingleLocalProjectStatusError;
    readonly error: Error;
}

export interface ReceiveLocalProjectStatusAction extends Action {
    readonly batchOperation: boolean;
    readonly lastBatchOperationItem: string | null;
    readonly localProject: LocalProject | null;
    readonly statusType: LocalProjectStatusTypeEnum;
    readonly type: typeof ProjectsActionsEnum.LocalProjectStatus;
    readonly background: boolean;
}

export interface DeleteUntrackedFilesForLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.DeleteUntrackedFilesForLocalProject;
    readonly localProject: LocalProject;
}

export interface DeleteUntrackedFilesForLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.DeleteUntrackedFilesForLocalProjectError;
    readonly error: Error;
}

export interface DiscardSelectedChangesForLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.DiscardSelectedChangesForLocalProject;
    readonly localProject: LocalProject;
}

export interface DiscardSelectedChangesForLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.DiscardSelectedChangesForLocalProjectError;
    readonly error: Error;
}

export interface SetProjectsFilterAction extends Action {
    readonly type: typeof ProjectsActionsEnum.SetProjectsFilter;
    readonly filters: string[];
}

export interface RemoveLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RemoveLocalProject;
    readonly directoryName: string;
    readonly removeAll: boolean;
}

export interface RemoveLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.RemoveLocalProjectError;
    readonly error: Error;
    readonly removingAll: boolean;
}

export interface UpdateLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.UpdateLocalProject;
    readonly directoryName: string;
    readonly updateAll: boolean;
    readonly background: boolean;
}

export interface UpdateLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.UpdateLocalProjectError;
    readonly error: Error;
    readonly updatingAll: boolean;
}

export interface CheckoutLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.CheckoutLocalProject;
    readonly url: string;
    readonly checkoutAll: boolean;
}

export interface CheckoutLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.CheckoutLocalProjectError;
    readonly error: Error;
    readonly checkingOutAll: boolean;
    readonly currentItem: string;
}

export interface PushLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.PushLocalProject;
    readonly directoryName: string;
    readonly pushingAll: boolean;
}

export interface PushLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.PushLocalProjectError;
    readonly error: Error;
    readonly pushingAll: boolean;
    readonly currentItem: string;
}

export interface CheckoutMasterBranchForLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.CheckoutMasterBranchForLocalProject;
    readonly directoryName: string;
}

export interface CheckoutMasterBranchForLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.CheckoutMasterBranchForLocalProjectError;
    readonly error: Error;
}

export interface CleanLocalProjectAction extends Action {
    readonly type: typeof ProjectsActionsEnum.CleanLocalProjectFolder;
    readonly directoryName: string;
}

export interface CleanLocalProjectErrorAction extends Action {
    readonly type: typeof ProjectsActionsEnum.CleanLocalProjectFolderError;
    readonly error: Error;
}

export type ProjectsActions = RequestProjectsAction | RequestProjectsErrorAction | ReceiveProjectsAction | ReceiveSingleProjectAction |
    RequestAllLocalProjectsAction | RequestAllLocalProjectsErrorAction | ReceiveAllLocalProjectsAction | ReceiveAllLocalProjectsProgressAction |
    RequestSingleLocalProjectStatusAction | RequestSingleLocalProjectStatusErrorAction | ReceiveLocalProjectStatusAction |
    DeleteUntrackedFilesForLocalProjectAction | DeleteUntrackedFilesForLocalProjectErrorAction |
    DiscardSelectedChangesForLocalProjectAction | DiscardSelectedChangesForLocalProjectErrorAction |
    SetProjectsFilterAction |
    RemoveLocalProjectAction | RemoveLocalProjectErrorAction |
    UpdateLocalProjectAction | UpdateLocalProjectErrorAction |
    CheckoutLocalProjectAction | CheckoutLocalProjectErrorAction |
    PushLocalProjectAction | PushLocalProjectErrorAction |
    CheckoutMasterBranchForLocalProjectAction | CheckoutMasterBranchForLocalProjectErrorAction |
    CleanLocalProjectAction | CleanLocalProjectErrorAction ;

function requestAllProjects(): RequestProjectsAction {
    return {
        type: ProjectsActionsEnum.RequestAllProjects
    };
}

function requestAllProjectsError(error: Error): RequestProjectsErrorAction {
    return {
        error,
        type: ProjectsActionsEnum.RequestAllProjectsError
    };
}

function receiveAllProjects(data: Project[]): ReceiveProjectsAction {
    return {
        data,
        type: ProjectsActionsEnum.ReceiveAllProjects
    };
}

function receiveSingleProject(project: Project): ReceiveSingleProjectAction {
    return {
        project,
        type: ProjectsActionsEnum.ReceiveSingleProject
    };
}

export const GetAllProjects = (dispatch: Dispatch) => {
    dispatch(requestAllProjects());
    sendApiRequest(ProjectsActionsEnum.RequestAllProjects);
};

function requestAllLocalProjects(): RequestAllLocalProjectsAction {
    return {
        type: ProjectsActionsEnum.RequestAllLocalProjects
    };
}

function requestAllLocalProjectsError(error: Error): RequestAllLocalProjectsErrorAction {
    return {
        error,
        type: ProjectsActionsEnum.RequestAllLocalProjectsError
    };
}

function receiveAllLocalProjects(data: LocalProject[]): ReceiveAllLocalProjectsAction {
    return {
        data,
        type: ProjectsActionsEnum.ReceiveAllLocalProjects
    };
}

function requestAllLocalProjectsProgress(progress: Progress): ReceiveAllLocalProjectsProgressAction {
    return {
        progress,
        type: ProjectsActionsEnum.ReceiveAllLocalProjectsProgress
    };
}

export const GetAllLocalProjects = (dispatch: Dispatch) => {
    dispatch(requestAllLocalProjects());
    sendApiRequest(ProjectsActionsEnum.RequestAllLocalProjects);
};

function requestSingleLocalProjectStatus(projectLocation: string): RequestSingleLocalProjectStatusAction {
    return {
        projectLocation,
        type: ProjectsActionsEnum.RequestSingleLocalProjectStatus
    };
}

function requestSingleLocalProjectStatusError(error: Error): RequestSingleLocalProjectStatusErrorAction {
    return {
        error,
        type: ProjectsActionsEnum.RequestSingleLocalProjectStatusError,
    };
}

function localProjectStatus(result: LocalProjectStatusResult): ReceiveLocalProjectStatusAction {
    return {
        background: result.isBackground,
        batchOperation: result.isBatchOperation,
        lastBatchOperationItem: result.batchOperationItem,
        localProject: result.localProject,
        statusType: result.statusType,
        type: ProjectsActionsEnum.LocalProjectStatus
    };
}

export function GetSingleLocalProjectStatus(dispatch: Dispatch, projectLocation: string) {
    dispatch(requestSingleLocalProjectStatus(projectLocation));
    sendApiRequest(ProjectsActionsEnum.RequestSingleLocalProjectStatus);
}

function deleteUntrackedFilesForLocalProject(localProject: LocalProject): DeleteUntrackedFilesForLocalProjectAction {
    return {
        localProject,
        type: ProjectsActionsEnum.DeleteUntrackedFilesForLocalProject
    };
}

function deleteUntrackedFilesForLocalProjectError(error: Error): DeleteUntrackedFilesForLocalProjectErrorAction {
    return {
        error,
        type: ProjectsActionsEnum.DeleteUntrackedFilesForLocalProjectError,
    };
}

export function DeleteUntrackedFilesForLocalProject(dispatch: Dispatch, localProject: LocalProject) {
    dispatch(deleteUntrackedFilesForLocalProject(localProject));
    sendApiRequest(ProjectsActionsEnum.DeleteUntrackedFilesForLocalProject, localProject);
}

function discardSelectedChangesForLocalProject(localProject: LocalProject): DiscardSelectedChangesForLocalProjectAction {
    return {
        localProject,
        type: ProjectsActionsEnum.DiscardSelectedChangesForLocalProject
    };
}

function discardSelectedChangesForLocalProjectError(error: Error): DiscardSelectedChangesForLocalProjectErrorAction {
    return {
        error,
        type: ProjectsActionsEnum.DiscardSelectedChangesForLocalProjectError,
    };
}

export function DiscardSelectedChangesForLocalProject(dispatch: Dispatch, localProject: LocalProject) {
    dispatch(discardSelectedChangesForLocalProject(localProject));
    sendApiRequest(ProjectsActionsEnum.DiscardSelectedChangesForLocalProject, localProject);
}

function setProjectsFilter(filters: string[]): SetProjectsFilterAction {
    return {
        filters,
        type: ProjectsActionsEnum.SetProjectsFilter
    };
}

export function SetProjectsFilter(dispatch: Dispatch, filters: string[]) {
    dispatch(setProjectsFilter(filters));
}

function removeLocalProject(directoryName: string, removeAll: boolean) {
    return {
        directoryName,
        removeAll,
        type: ProjectsActionsEnum.RemoveLocalProject
    };
}

function removeLocalProjectError(error: Error, removingAll: boolean) {
    return {
        error,
        removingAll,
        type: ProjectsActionsEnum.RemoveLocalProjectError
    };
}

export function RemoveLocalProject(dispatch: Dispatch, directoryName: string, removeAll: boolean) {
    dispatch(removeLocalProject(directoryName, removeAll));
    sendApiRequest(ProjectsActionsEnum.RemoveLocalProject, { directoryName, removeAll });
}

function updateLocalProject(directoryName: string, updateAll: boolean, background: boolean) {
    return {
        background,
        directoryName,
        type: ProjectsActionsEnum.UpdateLocalProject,
        updateAll
    };
}

function updateLocalProjectError(error: Error, updatingAll: boolean) {
    return {
        error,
        type: ProjectsActionsEnum.UpdateLocalProjectError,
        updatingAll
    };
}

export function UpdateLocalProject(dispatch: Dispatch, directoryName: string, updateAll: boolean, background: boolean) {
    dispatch(updateLocalProject(directoryName, updateAll, background));
    sendApiRequest(ProjectsActionsEnum.UpdateLocalProject, { directoryName, updateAll, background });
}

function checkoutLocalProject(url: string, checkoutAll: boolean) {
    return {
        checkoutAll,
        type: ProjectsActionsEnum.CheckoutLocalProject,
        url
    };
}

function checkoutLocalProjectError(error: Error, checkingOutAll: boolean, currentItem: string) {
    return {
        checkingOutAll,
        currentItem,
        error,
        type: ProjectsActionsEnum.CheckoutLocalProjectError
    };
}

export function CheckoutLocalProject(dispatch: Dispatch, url: string, checkoutAll: boolean) {
    dispatch(checkoutLocalProject(url, checkoutAll));
    sendApiRequest(ProjectsActionsEnum.CheckoutLocalProject, { url, checkoutAll });
}

function pushLocalProject(directoryName: string, pushingAll: boolean): PushLocalProjectAction {
    return {
        directoryName,
        pushingAll,
        type: ProjectsActionsEnum.PushLocalProject
    };
}

function pushLocalProjectError(error: Error, pushingAll: boolean, currentItem: string): PushLocalProjectErrorAction {
    return {
        currentItem,
        error,
        pushingAll,
        type: ProjectsActionsEnum.PushLocalProjectError
    };
}

export function PushLocalProject(dispatch: Dispatch, directoryName: string, pushAll: boolean) {
    dispatch(pushLocalProject(directoryName, pushAll));
    sendApiRequest(ProjectsActionsEnum.PushLocalProject, { directoryName, pushAll });
}

function checkoutMasterBranchForLocalProject(directoryName: string): CheckoutMasterBranchForLocalProjectAction {
    return {
        directoryName,
        type: ProjectsActionsEnum.CheckoutMasterBranchForLocalProject
    };
}

function checkoutMasterBranchForLocalProjectError(error: Error, currentItem: string) {
    return {
        currentItem,
        error,
        type: ProjectsActionsEnum.CheckoutMasterBranchForLocalProjectError
    };
}

export function CheckoutMasterBranchForLocalProject(dispatch: Dispatch, directoryName: string) {
    dispatch(checkoutMasterBranchForLocalProject(directoryName));
    sendApiRequest(ProjectsActionsEnum.CheckoutMasterBranchForLocalProject, directoryName);
}

function cleanLocalProject(directoryName: string) {
    return {
        directoryName,
        type: ProjectsActionsEnum.CleanLocalProjectFolder
    };
}

function cleanLocalProjectError(error: Error, directoryName: string) {
    return {
        directoryName,
        error,
        type: ProjectsActionsEnum.CleanLocalProjectFolderError
    };
}

export function CleanLocalProject(dispatch: Dispatch, directoryName: string) {
    dispatch(cleanLocalProject(directoryName));
    sendApiRequest(ProjectsActionsEnum.CleanLocalProjectFolder, { directoryName });
}

function openTortoiseGitCommitDialog(directoryName: string) {
    return {
        directoryName,
        type: ProjectsActionsEnum.OpenTortoiseGitCommitDialog
    };
}

export function OpenTortoiseGitCommitDialog(dispatch: Dispatch, directoryName: string) {
    dispatch(openTortoiseGitCommitDialog(directoryName));
    sendApiRequest(ProjectsActionsEnum.OpenTortoiseGitCommitDialog, directoryName);
}

export function configureProjectsActions(dispatch: Dispatch) {
    onApiResponse(ProjectsActionsEnum.ReceiveAllProjects, (data: Project[]) => {
        dispatch(receiveAllProjects(data));
    });
    onApiResponse(ProjectsActionsEnum.ReceiveSingleProject, (project: Project) => {
        dispatch(receiveSingleProject(project));
    });
    onApiResponse(ProjectsActionsEnum.RequestAllProjectsError, (error: Error) => {
        dispatch(requestAllProjectsError(error));
    });
    onApiResponse(ProjectsActionsEnum.ReceiveAllLocalProjects, (data: LocalProject[]) => {
        dispatch(receiveAllLocalProjects(data));
    });
    onApiResponse(ProjectsActionsEnum.RequestAllLocalProjectsError, (error: Error) => {
        dispatch(requestAllLocalProjectsError(error));
    });
    onApiResponse(ProjectsActionsEnum.ReceiveAllLocalProjectsProgress, (progress: Progress) => {
        dispatch(requestAllLocalProjectsProgress(progress));
    });
    onApiResponse(ProjectsActionsEnum.RequestSingleLocalProjectStatusError, (error: Error) => {
        dispatch(requestSingleLocalProjectStatusError(error));
    });
    onApiResponse(ProjectsActionsEnum.DeleteUntrackedFilesForLocalProjectError, (error: Error) => {
        dispatch(deleteUntrackedFilesForLocalProjectError(error));
    });
    onApiResponse(ProjectsActionsEnum.DiscardSelectedChangesForLocalProjectError, (error: Error) => {
        dispatch(discardSelectedChangesForLocalProjectError(error));
    });
    onApiResponse(ProjectsActionsEnum.LocalProjectStatus, (result: LocalProjectStatusResult) => {
        dispatch(localProjectStatus(result));
    });
    onApiResponse(ProjectsActionsEnum.RemoveLocalProjectError, (result: { error: Error, removingAll: boolean }) => {
        dispatch(removeLocalProjectError(result.error, result.removingAll));
    });
    onApiResponse(ProjectsActionsEnum.UpdateLocalProjectError, (result: any) => {
        dispatch(updateLocalProjectError(result.error, result.updatingAll));
    });
    onApiResponse(ProjectsActionsEnum.CheckoutLocalProjectError, (result: any) => {
        dispatch(checkoutLocalProjectError(result.error, result.checkingOutAll, result.currentItem));
    });
    onApiResponse(ProjectsActionsEnum.PushLocalProjectError, (result: { error: Error, pushingAll: boolean, currentItem: string }) => {
        dispatch(pushLocalProjectError(result.error, result.pushingAll, result.currentItem));
    });
    onApiResponse(ProjectsActionsEnum.CheckoutMasterBranchForLocalProjectError, (result: { error: Error, currentItem: string }) => {
        dispatch(checkoutMasterBranchForLocalProjectError(result.error, result.currentItem));
    });
    onApiResponse(ProjectsActionsEnum.CleanLocalProjectFolderError, (result: { error: Error, directoryName: string }) => {
        dispatch(cleanLocalProjectError(result.error, result.directoryName));
    });
}