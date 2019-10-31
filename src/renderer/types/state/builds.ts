import { TeamCityBuild } from '../teamCityBuild';

export interface BuildsState {
    didInvalidate: boolean;
    failedBuilds: TeamCityBuild[];
    fetchError: Error | null;
    isFetching: boolean;
    revisedCredentialsValid: boolean;
    unseenCount: number;
}