import { ApplicationState } from '../types';
import { ApplicationActionsEnum } from '../actions/applicationEnums';
import { ReceiveDeviceLockEventAction, ApplicationActions } from '../actions/application';

const initialState: ApplicationState = {
    acknowledgedDeviceLockEvent: false,
    activeTabIndex: 0,
    isDeviceLocked: false,
    isMonitoringLockEvents: false,
    isWatchingForChanges: false,
};

export function application(state: ApplicationState = initialState, action: ApplicationActions) {
    switch (action.type) {
        case ApplicationActionsEnum.MonitorDeviceLockEvents:
            return {
                ...state,
                acknowledgedDeviceLockEvent: false,
                isMonitoringLockEvents: true
            };

        case ApplicationActionsEnum.AcknowledgeDeviceLockEvent:
            return {
                ...state,
                acknowledgedDeviceLockEvent: true
            };

        case ApplicationActionsEnum.ReceiveDeviceLockEvent:
            return {
                ...state,
                acknowledgedDeviceLockEvent: false,
                isDeviceLocked: (action as ReceiveDeviceLockEventAction).isLocked
            };

        case ApplicationActionsEnum.WatchForProjectChanges:
            return {
                ...state,
                isWatchingForChanges: true
            };

        default:
            return state;
    }
}

export default application;