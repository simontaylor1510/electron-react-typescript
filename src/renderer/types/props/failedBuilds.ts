import { TeamCityBuild } from '..';

export interface FailedBuildsProps {
    failedBuilds: TeamCityBuild[];
    fetchError: Error | null;
    isFetching: boolean;
    requestFailedBuilds: () => void;
}