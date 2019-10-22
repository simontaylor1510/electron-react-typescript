import * as React from 'react';
import { TerminalUi } from './TerminalUi';

import {
    initializeIcons,
    loadTheme
} from 'office-ui-fabric-react';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';

import { Terminal } from 'xterm';

import * as pty from 'node-pty';
import { IPty, IPtyForkOptions } from 'node-pty';

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

export class App extends React.Component {
    private terminals: Map<number, Terminal> = new Map<number, Terminal>();
    private pseudoTtys: Map<number, IPty> = new Map<number, IPty>();
    private refreshRequired: Map<number, boolean> = new Map<number, boolean>();

    constructor(props: any) {
        super(props);

        this.setupFabricUi();
    }

    public render() {
        return (
            <React.Fragment>
                <Pivot>
                    <PivotItem
                        id='pivotItem.Service.FlightGetComments'
                        headerText='Service.FlightGetComments'>
                        <CommandBar items={getItems()} />
                        <TerminalUi
                            id='Service.FlightGetComments'
                            pty={this.getPseudoTtyForTab(0)}
                            terminal={this.getTerminalForTab(0)}
                            refreshRequired={() => this.getRefreshRequired(0)} />
                    </PivotItem>
                    <PivotItem
                        id='pivotItem.Library.Testing.Database'
                        headerText='Library.Testing.Database'>
                        <CommandBar items={getItems()} />
                        <TerminalUi
                            id='Library.Testing.Database'
                            pty={this.getPseudoTtyForTab(1)}
                            terminal={this.getTerminalForTab(1)}
                            refreshRequired={() => this.getRefreshRequired(1)} />
                    </PivotItem>
                </Pivot>
            </React.Fragment>
        );
    }

    private getTerminalForTab(tabIndex: number): Terminal {
        if (this.terminals.has(tabIndex)) {
            return this.terminals.get(tabIndex) as Terminal;
        }

        const terminalInstance = new Terminal({
            // experimentalCharAtlas: 'dynamic',
            fontFamily: 'Fira Code, Iosevka, monospace',
            fontSize: 14
        });

        return terminalInstance;
    }

    private getPseudoTtyForTab(tabIndex: number): IPty {
        if (this.pseudoTtys.has(tabIndex)) {
            return this.pseudoTtys.get(tabIndex) as IPty;
        }

        const ptyProcess = pty.spawn('cmd.exe', '/k C:\\Apps\\cmder\\vendor\\init.bat', {
            cols: 80,
            experimentalUseConpty: false,
            handleFlowControl: true,
            rows: 25
        } as IPtyForkOptions);

        console.log('Created a new pty');
        this.pseudoTtys.set(tabIndex, ptyProcess);
        this.refreshRequired.set(tabIndex, false);

        return ptyProcess;
    }

    private getRefreshRequired(tabIndex: number): boolean {
        if (this.refreshRequired.has(tabIndex)) {
            const result = this.refreshRequired.get(tabIndex) || true;
            this.refreshRequired.set(tabIndex, true);
            return result;
        }

        this.refreshRequired.set(tabIndex, false);
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