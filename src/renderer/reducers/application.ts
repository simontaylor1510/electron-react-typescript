import { ApplicationState, OnlineState } from '../types';
import { ApplicationActionsEnum } from '../actions/applicationEnums';
import {
    ReceiveDeviceLockEventAction,
    ApplicationActions,
    RepoSelectedAction,
    OpenedTerminalAction,
    SelectTerminalAction,
    CloseTerminalAction,
    ClosedTerminalAction,
    OnlineStateUpdatedAction
} from '../actions/application';

const initialState: ApplicationState = {
    acknowledgedDeviceLockEvent: false,
    activeTabIndex: 0,
    closingTerminal: null,
    isDeviceLocked: false,
    isMonitoringLockEvents: false,
    isWatchingForChanges: false,
    openTerminals: new Map<string, number>(),
    selectedRepo: null,
    selectedTerminal: -1,
    terminalToOpen: null,
    onlineState: {
        gitlab: false,
        gitlabNotifications: false,
        isConnectedToEasyJet: false,
        isOnline: true,
        teamCity: false,
        teamCityNotifications: false
    } as OnlineState
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

        case ApplicationActionsEnum.RepoSelected:
            return {
                ...state,
                selectedRepo: (action as RepoSelectedAction).repoName
            };

        case ApplicationActionsEnum.OpenTerminal:
            return {
                ...state,
                terminalToOpen: state.selectedRepo,
                selectedRepo: null
            };

        case ApplicationActionsEnum.OpenedTerminal:
            const newList = state.openTerminals;            
            if (state.terminalToOpen) {
                newList.set(state.terminalToOpen, (action as OpenedTerminalAction).tabIndex);
            }
            
            return {
                ...state,
                openTerminals: newList,
                terminalToOpen: null
            };

        case ApplicationActionsEnum.SelectTerminal:
            return {
                ...state,
                selectedTerminal: (action as SelectTerminalAction).tabIndex
            };

        case ApplicationActionsEnum.SelectedTerminal:
            return {
                ...state,
                selectedTerminal: -1
            };

        case ApplicationActionsEnum.CloseTerminal:
            return {
                ...state,
                closingTerminal: (action as CloseTerminalAction).id
            };
    
        case ApplicationActionsEnum.ClosedTerminal:
            const closed = (action as ClosedTerminalAction).id;
            const modifiedList = state.openTerminals;            
            if (state.openTerminals.has(closed)) {
                modifiedList.delete(closed);
            }
            
            return {
                ...state,
                closingTerminal: null
            };

        case ApplicationActionsEnum.OnlineStateUpdated:
            return {
                ...state,
                onlineState: (action as OnlineStateUpdatedAction).onlineState
            }
            break;
        
        default:
            return state;
    }
}

export default application;