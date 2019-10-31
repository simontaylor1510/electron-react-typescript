import { Dispatch, Action } from 'redux';

import { sendApiRequest, onApiResponse } from './apiClient';

import { ApplicationActionsEnum } from './applicationEnums';

export interface MonitorDeviceLockEventsAction extends Action {
    readonly type: typeof ApplicationActionsEnum.MonitorDeviceLockEvents;
}

export interface ReceiveDeviceLockEventAction extends Action {
    readonly type: typeof ApplicationActionsEnum.ReceiveDeviceLockEvent;
    readonly isLocked: boolean;
}

export interface AcknowledgeDeviceLockEventAction extends Action {
    readonly type: typeof ApplicationActionsEnum.AcknowledgeDeviceLockEvent;
}

export interface WatchForProjectChangesAction extends Action {
    readonly type: typeof ApplicationActionsEnum.WatchForProjectChanges;
}

export interface ElectronReadyAction extends Action {
    readonly type: typeof ApplicationActionsEnum.ElectronReady;
}

export type ApplicationActions = ElectronReadyAction | WatchForProjectChangesAction |
    MonitorDeviceLockEventsAction | ReceiveDeviceLockEventAction | AcknowledgeDeviceLockEventAction;

function monitorDeviceLockEvents(): MonitorDeviceLockEventsAction {
    return {
        type: ApplicationActionsEnum.MonitorDeviceLockEvents
    };
}

function receiveDeviceLockEvent(isLocked: boolean) {
    return {
        isLocked,
        type: ApplicationActionsEnum.ReceiveDeviceLockEvent
    };
}

export function MonitorDeviceLockEvents(dispatch: Dispatch) {
    dispatch(monitorDeviceLockEvents());
    sendApiRequest(ApplicationActionsEnum.MonitorDeviceLockEvents);
}

function acknowledgeDeviceLockEvent() {
    return {
        type: ApplicationActionsEnum.AcknowledgeDeviceLockEvent
    };
}

export function AcknowledgeDeviceLockEvent(dispatch: Dispatch) {
    dispatch(acknowledgeDeviceLockEvent());
    sendApiRequest(ApplicationActionsEnum.AcknowledgeDeviceLockEvent);
}

function watchForProjectChanges(): WatchForProjectChangesAction {
    return {
        type: ApplicationActionsEnum.WatchForProjectChanges
    };
}

export function WatchForProjectChanges(dispatch: Dispatch) {
    dispatch(watchForProjectChanges());
    sendApiRequest(ApplicationActionsEnum.WatchForProjectChanges);
}

function electronReady(): ElectronReadyAction {
    return {
        type: ApplicationActionsEnum.ElectronReady
    };
}

export function configureApplicationActions(dispatch: Dispatch) {
    onApiResponse(ApplicationActionsEnum.ReceiveDeviceLockEvent, (isLocked: boolean) => {
        dispatch(receiveDeviceLockEvent(isLocked));
    });
    onApiResponse(ApplicationActionsEnum.ElectronReady, () => {
        dispatch(electronReady());
    });
}
