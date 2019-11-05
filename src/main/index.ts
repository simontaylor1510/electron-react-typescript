import { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { format as formatUrl } from 'url';
import shell from 'node-powershell';

import { ApplicationLogger } from './utils/logger';
import { Server } from './api';

const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
    app.commandLine.appendSwitch('remote-debugging-port', '9223');
}

if (!fs.existsSync('.temp')) {
    fs.mkdirSync('.temp');
}

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null = null;
let server: Server;

function createMainWindow(): BrowserWindow {
    const window = new BrowserWindow({
        closable: true,
        frame: true,
        maximizable: true,
        minimizable: true,
        show: false,
        title: 'easyJet AL Developer Dashboard',
        webPreferences: {
            nodeIntegration: true
        }
    });

    if (isDevelopment) {
        window.webContents.openDevTools();
    }

    if (isDevelopment) {
        window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    }
    else {
        window.loadURL(formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }));
    }

    window.webContents.on('did-finish-load', async () => {
        server = new Server(window.webContents);
        await server.inititialiseAsync(true);
        window.maximize();
        window.show();
    });

    window.on('closed', () => {
        mainWindow = null;
    })

    window.webContents.on('devtools-opened', () => {
        window.focus();
        setImmediate(() => {
            window.focus();
        })
    })

    return window;
}

// quit application when all windows are closed
app.on('window-all-closed', async () => {
    // on macOS it is common for applications to stay open until the user explicitly quits
    if (process.platform !== 'darwin') {
        // TODO: See https://github.com/electron-userland/electron-webpack/issues/249
        if (isDevelopment) {
            await killElectronWebpackDevServer();
        }
        server.terminate();
        app.quit();
    }
});

// TODO: See https://github.com/electron-userland/electron-webpack/issues/249
const killElectronWebpackDevServer = async () => {
    let ps = new shell({ executionPolicy: 'Bypass', noProfile: true });
    ps.addCommand('wmic Path win32_process Where "CommandLine Like \'%webpack-dev-server%\'" Call Terminate');
    try {
        await ps.invoke();
    }
    // eslint-disable-next-line no-empty
    catch (e) {
    }
}

app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
        mainWindow = createMainWindow();
    }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    mainWindow = createMainWindow();
});

process.on('uncaughtException', (error: Error) => {
    // Handle the error
    ApplicationLogger.logError(error.message, error);
});
