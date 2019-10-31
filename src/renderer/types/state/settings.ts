export enum UserDetailsApiCall {
    None = 0,
    VerifyGitlabApiToken = 1,
    VerifyGitCredentials = 2,
    VerifyTeamCityCredentials = 3
}

export interface UserDetailsState {
    homeFolder: string;
    homeFolderSelected: boolean;
    teamCityUpdated: boolean;
    teamCityUsername: string;
    teamCityPassword: string;
    teamCityVerified: boolean;
    gitlabUpdated: boolean;
    gitlabUsername: string;
    gitlabPassword: string;
    gitlabVerified: boolean;
    apiToken: string;
    apiTokenUpdated: boolean;
    apiTokenVerified: boolean;
    lastApiCall: UserDetailsApiCall;
    lastApiCallCredentialsInvalid: boolean;
    lastApiCallFailureReason: string | null;
    lastApiCallResult: boolean;
    lastApiCallResultTime: number;
}

export interface SettingsState {
    userDetails: UserDetailsState;
}
