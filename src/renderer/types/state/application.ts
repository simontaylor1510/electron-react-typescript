export interface ApplicationState {
    acknowledgedDeviceLockEvent: boolean;
    activeTabIndex: number;
    isMonitoringLockEvents: boolean;
    isDeviceLocked: boolean;
    isWatchingForChanges: boolean;
    openTerminals: Map<string, number>;
    selectedRepo: string | null;
    selectedTerminal: number;
    terminalToOpen: string | null;
}