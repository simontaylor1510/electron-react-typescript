import { ApplicationLogger } from '../../utils/logger';
import { ApplicationActionsEnum } from '../../../renderer/actions/applicationEnums';
import * as edge from 'electron-edge-js';

export class SystemEvents {
    private currentLockState: boolean = false;
    private responseSender: (responseName: string, payload: any) => void;

    constructor(responseSender: (responseName: string, payload: any) => void) {
        this.responseSender = responseSender;
    }

    public async monitorDeviceLockEvents(): Promise<void> {
        monitorLockStatus({
            callback: (status: string) => {
                const newLockState = status === 'locked';
                if (newLockState !== this.currentLockState) {
                    this.currentLockState = newLockState;
                    if (newLockState) {
                         this.sendRepeatedLockNotifications();
                    }
                    this.responseSender(ApplicationActionsEnum.ReceiveDeviceLockEvent, this.currentLockState);
                }
            }
        }, (error: Error) => {
            if (error) {
                ApplicationLogger.logError('checkLockStatus', error);
            }
        });
    }

    private async sendRepeatedLockNotifications(): Promise<void> {
        const MIN_DELAY: number = 60000;
        const MAX_DELAY: number = 600000;
        let CURRENT_DELAY: number = MIN_DELAY;

        while (this.currentLockState) {
            const delayPromise = (delay: number) => new Promise(res => setTimeout(res, delay));
            await delayPromise(CURRENT_DELAY);
            if (this.currentLockState) {
                ApplicationLogger.logInfo(`LOCK STATE CHANGED: ${this.currentLockState}`);
                this.responseSender(ApplicationActionsEnum.ReceiveDeviceLockEvent, this.currentLockState);
                if (CURRENT_DELAY * 2 < MAX_DELAY) {
                    CURRENT_DELAY *= 2;
                }
            }
        }
    }
}

const monitorLockStatus = edge.func(`
    using System;
    using System.Threading.Tasks;
    using Microsoft.Win32;
    using System.Collections.Generic;

    public class Startup : IDisposable
    {
        private Func<object, Task<object>> callbackFunction;

        public async Task<object> Invoke(IDictionary<string, object> input)
        {
            callbackFunction = (Func<object, Task<object>>)input["callback"];
            SystemEvents.SessionSwitch += SystemEvents_SessionSwitch;
            return null;
        }

        public async void SystemEvents_SessionSwitch(object sender, SessionSwitchEventArgs e)
        {
            if (e.Reason == SessionSwitchReason.SessionLock)
            {
                callbackFunction("locked");
            }
            else if (e.Reason == SessionSwitchReason.SessionUnlock)
            {
                callbackFunction("unlocked");
            }
        }

        public void Dispose()
        {
            SystemEvents.SessionSwitch -= SystemEvents_SessionSwitch;
        }
    }
`);
