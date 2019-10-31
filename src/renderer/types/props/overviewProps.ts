export interface OverviewProps {
    failedBuildsCount: number;
    repositoriesWithLocalAndRemoteChangesCount: number;
    repositoriesWithChangesCount: number;
    repositoriesWithUnpushedChangesCount: number;
    repositoriesToPullCount: number;
    newRepositoriesCount: number;
    inaccessibleNewRepositoriesCount: number;
    deprecatedRepositoriesCount: number;
    allRepositoriesCount: number;
}