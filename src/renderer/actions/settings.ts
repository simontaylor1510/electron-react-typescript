import { Dispatch, Action } from 'redux';
import { ipcRenderer } from 'electron';
import { sendApiRequest, onApiResponse } from './apiClient';
import { SettingsActionsEnum } from './settingsEnums';
import { AppSettings, UpdatedSettings } from '../types';

export interface SelectFolderAction extends Action {
    readonly type: typeof SettingsActionsEnum.SelectFolder;
    readonly initialLocation: string;
}

export interface SelectedFolderAction extends Action {
    readonly type: typeof SettingsActionsEnum.SelectedFolder;
    readonly cancelled: boolean;
    readonly location: string;
}

export interface SettingsLoadedAction extends Action {
    appSettings: AppSettings;
    readonly type: typeof SettingsActionsEnum.SettingsLoaded;
}

export interface VerifyGitlabApiTokenAction extends Action {
    readonly apiToken: string;
    readonly type: typeof SettingsActionsEnum.VerifyGitlabApiToken;
    readonly username: string;
}

export interface VerifyGitlabApiTokenResultAction extends Action {
    readonly failureReason: string;
    readonly invalidCredentials: boolean;
    readonly success: boolean;
    readonly type: typeof SettingsActionsEnum.VerifyGitlabApiTokenResult;
}

export interface VerifyGitCredentialsAction extends Action {
    readonly password: string;
    readonly type: typeof SettingsActionsEnum.VerifyGitCredentials;
    readonly username: string;
}

export interface VerifyGitCredentialsResultAction extends Action {
    readonly failureReason: string;
    readonly invalidCredentials: boolean;
    readonly success: boolean;
    readonly type: typeof SettingsActionsEnum.VerifyGitCredentialsResult;
}

export interface VerifyTeamCityCredentialsAction extends Action {
    readonly password: string;
    readonly type: typeof SettingsActionsEnum.VerifyTeamCityCredentials;
    readonly username: string;
}

export interface VerifyTeamCityCredentialsResultAction extends Action {
    readonly failureReason: string;
    readonly invalidCredentials: boolean;
    readonly success: boolean;
    readonly type: typeof SettingsActionsEnum.VerifyTeamCityCredentialsResult;
}

export interface UpdateSettingsAction extends Action {
    readonly type: typeof SettingsActionsEnum.SaveUpdatedSettings;
    readonly updatedSettings: UpdatedSettings;
}

export type SettingsActions = SelectFolderAction | SelectedFolderAction |
    SettingsLoadedAction |
    VerifyGitlabApiTokenAction | VerifyGitlabApiTokenResultAction |
    VerifyGitCredentialsAction | VerifyGitCredentialsResultAction |
    VerifyTeamCityCredentialsAction | VerifyTeamCityCredentialsResultAction |
    UpdateSettingsAction;

function selectFolder(initialLocation: string): SelectFolderAction {
    return {
        initialLocation,
        type: SettingsActionsEnum.SelectFolder
    };
}

function selectedFolder(cancelled: boolean, location: string): SelectedFolderAction {
    return {
        cancelled,
        location,
        type: SettingsActionsEnum.SelectedFolder
    };
}

export function SelectFolder(dispatch: Dispatch, initialLocation: string) {
    dispatch(selectFolder(initialLocation));
    sendApiRequest(SettingsActionsEnum.SelectFolder, initialLocation);
}

function settingsLoaded(appSettings: AppSettings): SettingsLoadedAction {
    return {
        appSettings,
        type: SettingsActionsEnum.SettingsLoaded
    };
}

function verifyGitlabApiToken(username: string, apiToken: string): VerifyGitlabApiTokenAction {
    return {
        apiToken,
        type: SettingsActionsEnum.VerifyGitlabApiToken,
        username,
    } as VerifyGitlabApiTokenAction;
}

function verifyGitCredentials(username: string, password: string): VerifyGitCredentialsAction {
    return {
        password,
        type: SettingsActionsEnum.VerifyGitCredentials,
        username,
    } as VerifyGitCredentialsAction;
}

function verifyTeamCityCredentials(username: string, password: string): VerifyTeamCityCredentialsAction {
    return {
        password,
        type: SettingsActionsEnum.VerifyTeamCityCredentials,
        username,
    } as VerifyTeamCityCredentialsAction;
}

function saveSettings(updatedSettings: UpdatedSettings) {
    return {
        type: SettingsActionsEnum.SaveUpdatedSettings,
        updatedSettings
    } as UpdateSettingsAction;
}

export async function VerifyGitlabApiToken(dispatch: Dispatch, username: string, apiToken: string): Promise<CredentialsValidationResult> {
    dispatch(verifyGitlabApiToken(username, apiToken));
    const waitPromise = new Promise<CredentialsValidationResult>(resolve => {
        ipcRenderer.on(
            SettingsActionsEnum.VerifyGitlabApiTokenResult,
            (_: any, data: CredentialsValidationResult) => {
            resolve(data);
        });
        sendApiRequest(SettingsActionsEnum.VerifyGitlabApiToken, { username, apiToken });
    });
    return await waitPromise;
}

export async function VerifyGitCredentials(dispatch: Dispatch, username: string, password: string): Promise<CredentialsValidationResult> {
    dispatch(verifyGitCredentials(username, password));
    const waitPromise = new Promise<CredentialsValidationResult>(resolve => {
        ipcRenderer.on(
            SettingsActionsEnum.VerifyGitCredentialsResult,
            (_: any, data: CredentialsValidationResult) => {
            resolve(data);
        });
        sendApiRequest(SettingsActionsEnum.VerifyGitCredentials, { username, password });
    });
    return await waitPromise;
}

export async function VerifyTeamCityCredentials(dispatch: Dispatch, username: string, password: string): Promise<CredentialsValidationResult> {
    dispatch(verifyTeamCityCredentials(username, password));
    const waitPromise = new Promise<CredentialsValidationResult>(resolve => {
        ipcRenderer.on(
            SettingsActionsEnum.VerifyTeamCityCredentialsResult,
            (_: any, data: CredentialsValidationResult) => {
            resolve(data);
        });
        sendApiRequest(SettingsActionsEnum.VerifyTeamCityCredentials, { username, password });
    });
    return await waitPromise;
}

export async function SaveSettings(dispatch: Dispatch, updatedSettings: UpdatedSettings): Promise<boolean> {
    dispatch(saveSettings(updatedSettings));
    const waitPromise = new Promise<boolean>(resolve => {
        ipcRenderer.on(
            SettingsActionsEnum.SaveUpdatedSettingsResult,
            (_: any, data: boolean) => {
            resolve(data);
        });
        sendApiRequest(SettingsActionsEnum.SaveUpdatedSettings, updatedSettings);
    });
    const result = await waitPromise;
    return result;
}

export function configureSettingsActions(dispatch: Dispatch) {
    onApiResponse(SettingsActionsEnum.SelectedFolder, (result: any) => {
        dispatch(selectedFolder(result.cancelled, result.location));
    });
    onApiResponse(SettingsActionsEnum.SettingsLoaded, (appSettings: AppSettings) => {
        dispatch(settingsLoaded(appSettings));
    });
}