import { UserDetailsApiCall } from '..';
import { UpdatedSettings } from '../updatedSettings';

export interface UserDetailsProps {
    homeFolder: string;
    teamCityUsername: string;
    teamCityPassword: string;
    teamCityVerified: boolean;
    gitlabUsername: string;
    gitlabPassword: string;
    gitlabVerified: boolean;
    apiToken: string;
    gitlabApiTokenVerified: boolean;
    locateHomeFolder: (initialLocation: string) => void;
    saveSettings: (updatedSettings: UpdatedSettings) => Promise<boolean>;
    verifyTeamCity: (username: string, password: string) => Promise<CredentialsValidationResult>;
    verifyGitCredentials: (username: string, password: string) => Promise<CredentialsValidationResult>;
    verifyGitlabApiToken: (username: string, token: string) => Promise<CredentialsValidationResult>;
    lastApiCall: UserDetailsApiCall;
    lastApiCallCredentialsInvalid: boolean;
    lastApiCallFailureReason: string | null;
    lastApiCallResult: boolean;
    lastApiCallResultTime: number;
}