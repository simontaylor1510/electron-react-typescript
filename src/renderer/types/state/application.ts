export interface ApplicationState {
    acknowledgedDeviceLockEvent: boolean;
    activeTabIndex: number;
    isMonitoringLockEvents: boolean;
    isDeviceLocked: boolean;
    isWatchingForChanges: boolean;
}