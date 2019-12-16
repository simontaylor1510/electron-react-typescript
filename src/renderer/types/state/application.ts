import { OnlineState } from "../onlineState";

export interface ApplicationState {
    acknowledgedDeviceLockEvent: boolean;
    activeTabIndex: number;
    closingTerminal: string | null;
    isMonitoringLockEvents: boolean;
    isDeviceLocked: boolean;
    isWatchingForChanges: boolean;
    onlineState: OnlineState;
    openTerminals: Map<string, number>;
    selectedRepo: string | null;
    selectedTerminal: number;
    terminalToOpen: string | null;
}