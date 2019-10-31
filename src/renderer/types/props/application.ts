export interface ApplicationProps {
    acknowledgeDeviceLockEvent: () => void;
    acknowledgedDeviceLockEvent: boolean;
    activeTabIndex: number;
    cloneGitlabProject: (url: string, cloneAll: boolean) => void;
    cloningNewProjects: boolean;
    cloningProject: string | null;
    isDeviceLocked: boolean;
    isFetchingLocal: boolean;
    isMonitoringLockEvents: boolean;
    isWatchingForChanges: boolean;
    lastRefreshingProject: string | null;
    monitorDeviceLockEvents: () => void;
    nextProjectToClone: string | null;
    nextBackgroundProjectToRefresh: string | null;
    nextProjectToRefresh: string | null;
    nextProjectToRemove: string | null;
    refreshingOutOfDateProjects: boolean;
    refreshingOutOfDateProjectsInBackground: boolean;
    refreshingProject: string | null;
    removeLocalProject: (projectLocation: string, updateAll: boolean) => void;
    removingDeprecatedProjects: boolean;
    removingProject: string | null;
    requestAllProjects: () => void;
    requestFailedBuilds: () => void;
    updateLocalProject: (projectLocation: string, updateAll: boolean, background: boolean) => void;
    watchForProjectChanges: () => void;
}