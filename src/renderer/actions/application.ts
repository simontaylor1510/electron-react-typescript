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

export interface RepoSelectedAction extends Action {
    readonly type: typeof ApplicationActionsEnum.RepoSelected;
    readonly repoName: string;
}

export interface OpenTerminalAction extends Action {
    readonly type: typeof ApplicationActionsEnum.OpenTerminal;
    readonly repoName: string;
}

export interface OpenedTerminalAction extends Action {
    readonly type: typeof ApplicationActionsEnum.OpenedTerminal;
    readonly tabIndex: number;
}

export interface SelectTerminalAction extends Action {
    readonly type: typeof ApplicationActionsEnum.SelectTerminal;
    readonly tabIndex: number;
}

export interface SelectedTerminalAction extends Action {
    readonly type: typeof ApplicationActionsEnum.SelectedTerminal;
    readonly tabIndex: number;
}

export interface CloseTerminalAction extends Action {
    readonly type: typeof ApplicationActionsEnum.CloseTerminal;
    readonly id: string;
}

export interface ClosedTerminalAction extends Action {
    readonly type: typeof ApplicationActionsEnum.ClosedTerminal;
    readonly id: string;
}

export type ApplicationActions = ElectronReadyAction | WatchForProjectChangesAction |
    MonitorDeviceLockEventsAction | ReceiveDeviceLockEventAction | AcknowledgeDeviceLockEventAction |
    RepoSelectedAction | OpenTerminalAction | OpenedTerminalAction |
    SelectTerminalAction | SelectedTerminalAction |
    CloseTerminalAction | ClosedTerminalAction;

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

function repoSelected(repoName: string) {
    return {
        type: ApplicationActionsEnum.RepoSelected,
        repoName
    };
}

export function RepoSelected(dispatch: Dispatch, repoName: string) {
    dispatch(repoSelected(repoName));
}

function openTerminal() {
    return {
        type: ApplicationActionsEnum.OpenTerminal
    };
}

export function OpenTerminal(dispatch: Dispatch) {
    dispatch(openTerminal());
}

function openedTerminal(tabIndex: number) {
    return {
        type: ApplicationActionsEnum.OpenedTerminal,
        tabIndex
    };
}

export function OpenedTerminal(dispatch: Dispatch, tabIndex: number) {
    dispatch(openedTerminal(tabIndex));
}

function selectTerminal(tabIndex: number) {
    return {
        type: ApplicationActionsEnum.SelectTerminal,
        tabIndex
    };
}

export function SelectTerminal(dispatch: Dispatch, tabIndex: number) {
    dispatch(selectTerminal(tabIndex));
}

function selectedTerminal(tabIndex: number) {
    return {
        type: ApplicationActionsEnum.SelectedTerminal,
        tabIndex
    };
}

export function SelectedTerminal(dispatch: Dispatch, tabIndex: number) {
    dispatch(selectedTerminal(tabIndex));
}

function closeTerminal(id: string) {
    return {
        type: ApplicationActionsEnum.CloseTerminal,
        id
    };
}

export function CloseTerminal(dispatch: Dispatch, id: string) {
    dispatch(closeTerminal(id));
}

function closedTerminal(id: string) {
    return {
        type: ApplicationActionsEnum.ClosedTerminal,
        id
    };
}

export function ClosedTerminal(dispatch: Dispatch, id: string) {
    dispatch(closedTerminal(id));
}
