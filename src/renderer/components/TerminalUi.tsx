import * as React from 'react';
import { Terminal, IDisposable } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { IPty } from 'node-pty';
import { debounce } from 'lodash';

import '../../../node_modules/xterm/css/xterm.css';

export interface TerminalProps {
    id: string;
    terminal: Terminal;
    pty: IPty;
    refreshRequired: () => boolean;
}

export class TerminalUi extends React.Component<TerminalProps> {
    private terminalDiv!: HTMLElement | null;
    private terminalInstance!: Terminal | null;
    private terminalDataListenerDisposable!: IDisposable;
    private terminalResizeListenerDisposable!: IDisposable;
    private fitAddon!: FitAddon;
    private cols: number = 1;
    private rows: number = 1;
    
    private ptyProcess: IPty | null = null;
    private ptyDataListenerDisposable!: IDisposable;
    private ptyExitListenerDisposable!: IDisposable;

    private firstResponse: boolean = true;
    private fitted: boolean = false;
    private refreshRequired: boolean = false;

    constructor(props: TerminalProps) {
        super(props);

        this.terminalInstance = this.props.terminal;
        this.ptyProcess = this.props.pty;
        this.refreshRequired = this.props.refreshRequired();
    }

    componentDidMount() {
        this.connectTerminalAndPty();
        this.terminalDiv = document.getElementById('terminal');
        window.addEventListener('resize', this.resizeTerminalUi);
        this.addTerminalToUi();
        if (this.refreshRequired) {
            if (this.ptyProcess != null) {
                this.ptyProcess.resize(this.cols, this.rows);
            }
            if (this.terminalInstance != null) {
                this.terminalInstance.refresh(0, this.rows - 1);
            }
        }
        if (this.terminalInstance != null) {
            this.terminalInstance.focus();
        }
    }
    
    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeTerminalUi);
        this.detachTerminalFromUi();
        this.disconnectPtyEventHandlers();
    }

    public render() {
        return (
            <div id='terminal' style={{ backgroundColor: 'black', height: 'calc(100vh - 118px)' }} />
        );
    }

    private connectTerminalAndPty() {
        this.fitAddon = new FitAddon();
        this.createAndConnectTerminal();
        this.createAndConnectPty();
    }

    private resizeTerminalUi = debounce(() => {
        this.fitted = true;
        this.fitAddon.fit();
    }, 17);

    private createAndConnectTerminal(): void {
        if (this.terminalInstance) {
            this.terminalInstance.loadAddon(this.fitAddon);
            this.terminalDataListenerDisposable = this.terminalInstance.onData(this.onDataReceivedFromTerminal);
            this.terminalResizeListenerDisposable = this.terminalInstance.onResize(this.onTerminalResized);
        }
    }

    private addTerminalToUi(): void {
        if (!this.terminalInstance) {
            this.createAndConnectTerminal();
        }

        if (this.terminalDiv && this.terminalInstance) {
            this.terminalInstance.open(this.terminalDiv);

            this.fitTerminalToDiv();
            // ligaturesAddon.activate(terminal);
        }
    }

    private detachTerminalFromUi(): void {
        if (this.terminalDiv) {
            if (this.terminalInstance) {
                this.terminalDataListenerDisposable.dispose();
                this.terminalResizeListenerDisposable.dispose();
            }
            this.terminalDiv = null;
        }

        this.fitAddon.dispose();
    }

    private fitTerminalToDiv(): void {
        if (this.terminalInstance) {
            if (!this.fitted) {
                this.fitAddon.fit();
            }
            this.fitted = false;
            this.cols = this.terminalInstance.cols;
            this.rows = this.terminalInstance.rows;
        }
    }

    private onDataReceivedFromTerminal = (data: string) => {
        if (this.ptyProcess) {
            this.ptyProcess.write(data);
        }
    }

    private onTerminalResized = (size: { cols: number, rows: number }) => {
        if (this.terminalDiv) {
            this.fitTerminalToDiv();
            if (size && this.ptyProcess) {
                this.cols = size.cols;
                this.rows = size.rows;
                if (this.terminalInstance != null) {
                    this.terminalInstance.refresh(0, this.rows);
                }
            }
        }
        if (this.ptyProcess) {
            this.ptyProcess.resize(this.cols, this.rows);
        }
    }

    private createAndConnectPty() {
        if (this.ptyProcess != null) {
            this.ptyDataListenerDisposable = this.ptyProcess.onData(this.onDataReceivedFromPseudoTty);
            this.ptyExitListenerDisposable = this.ptyProcess.onExit(this.onPseudoTtyProcessExited);
        }
    }

    private disconnectPtyEventHandlers() {
        if (this.ptyProcess) {
            this.ptyDataListenerDisposable.dispose();
            this.ptyExitListenerDisposable.dispose();
        }
    }

    private onPseudoTtyProcessExited = (e: { exitCode: number, signal?: number | undefined }) => {
        this.disconnectPtyEventHandlers();
        if (this.terminalInstance) {
            this.terminalInstance.write(`\r\n\r\npty process exited with exitCode: ${e.exitCode}`);
        }
    }

    private onDataReceivedFromPseudoTty = (data: string) => {
        if (this.terminalInstance) {
            if (this.firstResponse) {
                this.firstResponse = false;
                if (this.ptyProcess) {
                    this.cols = this.terminalInstance.cols;
                    this.rows = this.terminalInstance.rows;
                    this.ptyProcess.resize(this.cols, this.rows);
                }
            }

            this.terminalInstance.write(data);
        }
    }
}