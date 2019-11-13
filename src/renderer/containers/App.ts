import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { App } from '../components/App';
import { GlobalState } from '../types';
import { CheckoutLocalProject, RemoveLocalProject, UpdateLocalProject, GetAllProjects } from '../actions/projects';
import { AcknowledgeDeviceLockEvent, MonitorDeviceLockEvents, WatchForProjectChanges, OpenedTerminal, SelectTerminal, SelectedTerminal } from '../actions/application';
import { GetFailedBuilds } from '../actions';

export function mapStateToProps(state: GlobalState, _: Dispatch) {
    const isDeviceLocked = state.application.isDeviceLocked;
    const isBackgroundRefreshing = state.projects.outOfDateProjects.refreshingOutOfDateProjectsInBackground;
    const cancelBackground = !isDeviceLocked && isBackgroundRefreshing;
    const localProjectToOpen = state.application.terminalToOpen ? state.projects.allLocalProjects.find(lp => lp.name === state.application.terminalToOpen) : undefined;

    return {
        acknowledgedDeviceLockEvent: state.application.acknowledgedDeviceLockEvent,
        activeTabIndex: state.application.activeTabIndex,
        cloningNewProjects: state.projects.newProjects.cloningNewProjects,
        cloningProject: state.projects.newProjects.cloningProject,
        isDeviceLocked: state.application.isDeviceLocked,
        isFetchingLocal: state.projects.isFetchingLocal,
        isMonitoringLockEvents: state.application.isMonitoringLockEvents,
        isWatchingForChanges: state.application.isWatchingForChanges,
        lastRefreshingProject: state.projects.outOfDateProjects.lastRefreshedProject,
        nextBackgroundProjectToRefresh: cancelBackground ? null : state.projects.outOfDateProjects.nextBackgroundProjectToRefresh,
        nextProjectToClone: state.projects.newProjects.nextProjectToClone,
        nextProjectToRefresh: state.projects.outOfDateProjects.nextProjectToRefresh,
        nextProjectToRemove: state.projects.deprecatedProjects.nextProjectToRemove,
        openTerminals: state.application.openTerminals,
        refreshingOutOfDateProjects: state.projects.outOfDateProjects.refreshingOutOfDateProjects,
        refreshingOutOfDateProjectsInBackground: cancelBackground ? false : state.projects.outOfDateProjects.refreshingOutOfDateProjectsInBackground,
        refreshingProject: cancelBackground ? null : state.projects.outOfDateProjects.refreshingProject,
        removingDeprecatedProjects: state.projects.deprecatedProjects.removingDeprecatedProjects,
        removingProject: state.projects.deprecatedProjects.removingProject,
        selectedTerminalTab: state.application.selectedTerminal,
        terminalToOpen: state.application.terminalToOpen,
        terminalToOpenDirectory: localProjectToOpen ? `${state.settings.userDetails.homeFolder}/${localProjectToOpen.directoryName}` : null
    };
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
    acknowledgeDeviceLockEvent: () => AcknowledgeDeviceLockEvent(dispatch),
    cloneGitlabProject: (url: string, cloneAll: boolean) => CheckoutLocalProject(dispatch, url, cloneAll),
    monitorDeviceLockEvents: () => MonitorDeviceLockEvents(dispatch),
    openedTerminal: (tabIndex: number) => OpenedTerminal(dispatch, tabIndex),
    removeLocalProject: (projectDirectory: string, removeAll: boolean) => RemoveLocalProject(dispatch, projectDirectory, removeAll),
    requestAllProjects: () => GetAllProjects(dispatch),
    requestFailedBuilds: () => GetFailedBuilds(dispatch),
    selectTerminal: (tabIndex: number) => SelectTerminal(dispatch, tabIndex),
    selectedTerminal: (tabIndex: number) => SelectedTerminal(dispatch, tabIndex),
    updateLocalProject:
        (projectDirectory: string, updateAll: boolean, background: boolean) => UpdateLocalProject(dispatch, projectDirectory, updateAll, background),
    watchForProjectChanges: () => WatchForProjectChanges(dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);