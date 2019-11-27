import * as React from 'react';
import { TerminalUi } from './TerminalUi';
import ProjectSelector from '../containers/ProjectSelector';

import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { loadTheme } from 'office-ui-fabric-react/lib/Styling';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Pivot, PivotItem, IPivotItemProps } from 'office-ui-fabric-react/lib/Pivot';

import { Terminal } from 'xterm';

import * as pty from 'node-pty';
import { IPty, IPtyForkOptions } from 'node-pty';
import { ApplicationProps } from '../types';
import { ApplicationLogger } from '../../main/utils/logger';

const getItems = () => {
    return [
        {
            key: 'newItem',
            name: 'New',
            cacheKey: 'myCacheKey', // changing this key will invalidate this items cache
            iconProps: {
                iconName: 'Add'
            },
            ariaLabel: 'New',
            subMenuProps: {
                items: [
                    {
                        key: 'emailMessage',
                        name: 'Email message',
                        iconProps: {
                            iconName: 'Mail'
                        },
                    },
                    {
                        key: 'calendarEvent',
                        name: 'Calendar event',
                        iconProps: {
                            iconName: 'Calendar'
                        }
                    }
                ]
            }
        },
        {
            key: 'upload',
            name: 'Upload',
            iconProps: {
                iconName: 'Upload'
            },
            href: 'https://dev.office.com/fabric',
        },
        {
            key: 'share',
            name: 'Share',
            iconProps: {
                iconName: 'Share'
            },
            onClick: () => console.log('Share')
        },
        {
            key: 'download',
            name: 'Download',
            iconProps: {
                iconName: 'Download'
            },
            onClick: () => console.log('Download')
        }
    ];
};

interface AppState {
    selectedTab: number
}

export class App extends React.Component<ApplicationProps, AppState> {
    private terminals: Map<string, Terminal> = new Map<string, Terminal>();
    private pseudoTtys: Map<string, IPty> = new Map<string, IPty>();
    private refreshRequired: Map<string, boolean> = new Map<string, boolean>();
    private pivotItems: React.ReactElement<IPivotItemProps>[] = [];

    constructor(props: any) {
        super(props);

        this.setupFabricUi();

        this.pivotItems.push(
            <PivotItem
                id='list'
                itemKey='list'
                key='list'
                headerText='List'>
                <CommandBar items={getItems()} />
                <ProjectSelector />
            </PivotItem>
        );

        this.state = {
            selectedTab: 0
        } as AppState;
    }

    public componentDidMount() {
        window.addEventListener('online', this.handleOnlineStatusChanged);
        window.addEventListener('offline', this.handleOnlineStatusChanged);
        window.addEventListener('resize', this.handleOnlineStatusChanged);

        this.handleOnlineStatusChanged();
    }

    public render() {
        const selectedKey = `${this.pivotItems[this.state.selectedTab].key || ''}`;

        return (
            <React.Fragment>
                <Pivot selectedKey={selectedKey} onLinkClick={(item) => this.setState({ selectedTab: (item && this.pivotItems.findIndex(pi => pi.key === item.props.itemKey) || 0) })}>
                    {this.pivotItems}
                </Pivot>
            </React.Fragment>
        );
    }

    public componentDidUpdate() {
        if (!this.props.isWatchingForChanges && !this.props.isFetchingLocal) {
            this.props.watchForProjectChanges();
            return;
        }
        if (this.props.isDeviceLocked && !this.props.acknowledgedDeviceLockEvent) {
            this.props.acknowledgeDeviceLockEvent();
            return;
        }
        if (!this.props.isMonitoringLockEvents) {
            this.props.monitorDeviceLockEvents();
            return;
        }
        if (this.props.isDeviceLocked && this.props.acknowledgedDeviceLockEvent && !this.props.refreshingOutOfDateProjectsInBackground) {
            if (this.backgroundUpdatesEnabled && this.props.nextBackgroundProjectToRefresh != null) {
                this.props.updateLocalProject(this.props.nextBackgroundProjectToRefresh, true, true);
            }

            return;
        }
        if (this.props.refreshingOutOfDateProjects && !this.props.refreshingOutOfDateProjectsInBackground &&
            this.props.refreshingProject === null && this.props.nextProjectToRefresh !== null) {
            this.props.updateLocalProject(this.props.nextProjectToRefresh, true, false);
            return;
        }
        if (!this.props.refreshingOutOfDateProjects && this.props.refreshingOutOfDateProjectsInBackground &&
            this.props.refreshingProject === null && this.props.nextBackgroundProjectToRefresh !== null) {
            this.props.updateLocalProject(this.props.nextBackgroundProjectToRefresh, true, true);
            return;
        }
        if (this.props.removingDeprecatedProjects && this.props.removingProject === null && this.props.nextProjectToRemove !== null) {
            this.props.removeLocalProject(this.props.nextProjectToRemove, this.props.removingDeprecatedProjects);
            return;
        }
        if (this.props.cloningNewProjects && this.props.cloningProject === null && this.props.nextProjectToClone !== null) {
            this.props.cloneGitlabProject(this.props.nextProjectToClone, this.props.cloningNewProjects);
            return;
        }

        if (this.props.terminalToOpen) {
            this.showOrAddTerminalTab(this.props.terminalToOpen, this.props.terminalToOpenDirectory);
        }

        if (this.props.selectedTerminalTab >= 0) {
            this.setState({ selectedTab: this.props.selectedTerminalTab });
            this.props.selectedTerminal(this.props.selectedTerminalTab);
        }

        if (this.props.closingTerminal) {
            const pivotItemIndex = this.pivotItems.findIndex(pi => pi.key === `pivotItem.${this.props.closingTerminal}`);
            if (pivotItemIndex >= 0) {
                this.pivotItems.splice(pivotItemIndex, 1);
                this.setState({ selectedTab: this.state.selectedTab - 1 });
            }
            this.props.closedTerminal(this.props.closingTerminal);
        }
    }

    private handleOnlineStatusChanged(): void {
        ApplicationLogger.logInfo(`Application online status changed to ${navigator.onLine}`);
    }

    private showOrAddTerminalTab(repoName: string, directory: string | null): void {
        const existingIndex = this.pivotItems.findIndex(pi => pi.key === `pivotItem.${repoName}`);
        if (existingIndex !== -1) {
            this.props.openedTerminal(existingIndex);
            this.props.selectTerminal(existingIndex);
            return;
        }

        const index = this.pivotItems.length;

        this.pivotItems.push(
            <PivotItem
                id={`pivotItem.${repoName}`}
                itemKey={`pivotItem.${repoName}`}
                key={`pivotItem.${repoName}`}
                headerText={`${repoName}`}>
                <TerminalUi
                    id={repoName}
                    pty={this.getPseudoTtyForTab(repoName, directory)}
                    terminal={this.getTerminalForTab(repoName)}
                    refreshRequired={() => this.getRefreshRequired(repoName)}
                    closeTerminal={this.props.closeTerminal} />
            </PivotItem>
        );

        this.props.openedTerminal(index);
        this.props.selectTerminal(index);
    }

    private get backgroundUpdatesEnabled(): boolean {
        return false;
    }
    
    private getTerminalForTab(repoName: string): Terminal {
        if (this.terminals.has(repoName)) {
            return this.terminals.get(repoName) as Terminal;
        }

        const terminalInstance = new Terminal({
            // experimentalCharAtlas: 'dynamic',
            fontFamily: 'Fira Code, Iosevka, monospace',
            fontSize: 14
        });

        return terminalInstance;
    }

    private getPseudoTtyForTab(repoName: string, directory: string | null): IPty {
        if (this.pseudoTtys.has(repoName)) {
            return this.pseudoTtys.get(repoName) as IPty;
        }

        const ptyProcess = pty.spawn('cmd.exe', '/k C:\\Apps\\cmder\\vendor\\init.bat', {
            cols: 80,
            experimentalUseConpty: false,
            handleFlowControl: true,
            rows: 25,
            cwd: directory
        } as IPtyForkOptions);

        this.pseudoTtys.set(repoName, ptyProcess);
        this.refreshRequired.set(repoName, false);

        return ptyProcess;
    }

    private getRefreshRequired(repoName: string): boolean {
        if (this.refreshRequired.has(repoName)) {
            const result = this.refreshRequired.get(repoName) || true;
            this.refreshRequired.set(repoName, true);
            return result;
        }

        this.refreshRequired.set(repoName, false);
        return false;
    }

    private setupFabricUi() {
        initializeIcons();

        loadTheme({
            palette: {
                black: '#f9f9f9',
                neutralDark: '#f4f4f4',
                neutralLight: '#252525',
                neutralLighter: '#151515',
                neutralLighterAlt: '#0b0b0b',
                neutralPrimary: '#d2d1d0',
                neutralPrimaryAlt: '#eaeae9',
                neutralQuaternary: '#373737',
                neutralQuaternaryAlt: '#2f2f2f',
                neutralSecondary: '#e5e5e4',
                neutralTertiary: '#e0dfdf',
                neutralTertiaryAlt: '#595959',
                themeDark: '#3595de',
                themeDarkAlt: '#1684d8',
                themeDarker: '#66afe7',
                themeLight: '#00243f',
                themeLighter: '#001322',
                themeLighterAlt: '#000508',
                themePrimary: '#0078d4',
                themeSecondary: '#006aba',
                themeTertiary: '#00487f',
                white: '#000000',
            }
        });
    }
}