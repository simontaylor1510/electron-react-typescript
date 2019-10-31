import {
    SettingsActions,
    SettingsLoadedAction,
    VerifyGitlabApiTokenResultAction,
    VerifyGitCredentialsResultAction,
    VerifyTeamCityCredentialsResultAction
} from '../actions/settings';
import { SettingsActionsEnum } from '../actions/settingsEnums';
import { UserDetailsApiCall } from '../types';
import { SettingsState, UserDetailsState } from '../types/state/settings';

const initialState: SettingsState = {
    userDetails: {
        apiToken: '',
        apiTokenUpdated: false,
        apiTokenVerified: false,
        gitlabPassword: '',
        gitlabUpdated: false,
        gitlabUsername: '',
        gitlabVerified: false,
        homeFolder: 'C:\\EJ',
        homeFolderSelected: false,
        lastApiCall: UserDetailsApiCall.None,
        lastApiCallCredentialsInvalid: false,
        lastApiCallFailureReason: null,
        lastApiCallResult: false,
        lastApiCallResultTime: -1,
        teamCityPassword: '',
        teamCityUpdated: false,
        teamCityUsername: '',
        teamCityVerified: false
    }
};

export function settings(state: SettingsState = initialState, action: SettingsActions) {
    switch (action.type) {
        case SettingsActionsEnum.SelectFolder:
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    apiTokenVerified: false,
                    gitlabVerified: false,
                    homeFolderSelected: false,
                    lastApiCall: UserDetailsApiCall.None,
                    lastApiCallFailureReason: null
                } as UserDetailsState
            } as SettingsState;

        case SettingsActionsEnum.SelectedFolder:
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    homeFolder: !action.cancelled ? action.location : state.userDetails.homeFolder,
                    homeFolderSelected: true
                }
            } as SettingsState;

        case SettingsActionsEnum.SettingsLoaded:
            const appSettings = (action as SettingsLoadedAction).appSettings;
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    apiToken: appSettings.apiToken,
                    gitlabPassword: '',
                    gitlabUsername: appSettings.gitlabUsername,
                    homeFolder: appSettings.rootFolder,
                    teamCityPassword: '',
                    teamCityUsername: appSettings.teamCityUsername
                } as UserDetailsState
            } as SettingsState;

        case SettingsActionsEnum.VerifyTeamCityCredentials:
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    apiTokenVerified: false,
                    gitlabVerified: false,
                    homeFolderSelected: false,
                    lastApiCall: UserDetailsApiCall.None,
                    lastApiCallFailureReason: null
                }
            } as SettingsState;

        case SettingsActionsEnum.VerifyTeamCityCredentialsResult:
            const teamCityResult = action as VerifyTeamCityCredentialsResultAction;
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    lastApiCall: UserDetailsApiCall.VerifyTeamCityCredentials,
                    lastApiCallCredentialsInvalid: teamCityResult.invalidCredentials,
                    lastApiCallFailureReason: teamCityResult.failureReason,
                    lastApiCallResult: teamCityResult.success,
                    lastApiCallResultTime: new Date().getTime()
                } as UserDetailsState
            } as SettingsState;

        case SettingsActionsEnum.VerifyGitlabApiToken:
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    apiTokenVerified: false,
                    gitlabVerified: false,
                    homeFolderSelected: false,
                    lastApiCall: UserDetailsApiCall.None,
                    lastApiCallFailureReason: null
                }
            } as SettingsState;

        case SettingsActionsEnum.VerifyGitlabApiTokenResult:
            const tokenResult = action as VerifyGitlabApiTokenResultAction;
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    lastApiCall: UserDetailsApiCall.VerifyGitlabApiToken,
                    lastApiCallCredentialsInvalid: tokenResult.invalidCredentials,
                    lastApiCallFailureReason: tokenResult.failureReason,
                    lastApiCallResult: tokenResult.success,
                    lastApiCallResultTime: new Date().getTime()
                } as UserDetailsState
            } as SettingsState;

        case SettingsActionsEnum.VerifyGitCredentials:
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    apiTokenVerified: false,
                    gitlabVerified: false,
                    homeFolderSelected: false,
                    lastApiCall: UserDetailsApiCall.None,
                    lastApiCallFailureReason: null
                } as UserDetailsState
            } as SettingsState;

        case SettingsActionsEnum.VerifyGitCredentialsResult:
            const credentialsResult = action as VerifyGitCredentialsResultAction;
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    lastApiCall: UserDetailsApiCall.VerifyGitCredentials,
                    lastApiCallCredentialsInvalid: credentialsResult.invalidCredentials,
                    lastApiCallFailureReason: credentialsResult.failureReason,
                    lastApiCallResult: credentialsResult.success,
                    lastApiCallResultTime: new Date().getTime()
                } as UserDetailsState
            } as SettingsState;

        default:
            return {
                ...state,
                userDetails: {
                    ...state.userDetails,
                    lastApiCall: UserDetailsApiCall.None,
                    lastApiCallFailureReason: null
                } as UserDetailsState
            } as SettingsState;
    }
}
