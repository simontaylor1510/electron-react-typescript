export enum ApplicationActionsEnum {
    AcknowledgeDeviceLockEvent = 'application/ACKNOWLEDGE_DEVICE_LOCK_EVENT',
    MonitorDeviceLockEvents = 'application/MONITOR_DEVICE_LOCK_EVENTS',
    ReceiveDeviceLockEvent = 'application/RECEIVE_DEVICE_LOCK_EVENT',
    WatchForProjectChanges = 'application/WATCH_FOR_PROJECT_CHANGES',
    ElectronReady = 'application/ELECTRON_READY',
    RepoSelected = 'application/REPO_SELECTED',
    OpenTerminal = 'application/OPEN_TERMINAL',
    OpenedTerminal = 'application/OPENED_TERMINAL',
    CloseTerminal = 'application/CLOSE_TERMINAL',
    ClosedTerminal = 'application/CLOSED_TERMINAL',
    SelectTerminal = 'application/SELECT_TERMINAL',
    SelectedTerminal = 'application/SELECTED_TERMINAL'
}