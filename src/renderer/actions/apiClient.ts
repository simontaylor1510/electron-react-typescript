import { IpcPayload } from '../types';
import { ipcRenderer } from 'electron';

export function onApiResponse(expectedResponse: string, callback: (data: any) => void) {
    if (ipcRenderer) {
        ipcRenderer.removeAllListeners(expectedResponse);
        ipcRenderer.on(expectedResponse, (_: any, data: any) => callback(data));
    }
}

export function sendApiRequest(apiRequestName: string, payload?: any) {
    if (ipcRenderer) {
        ipcRenderer.send('nodeApi', {
            args: payload,
            requestName: apiRequestName
        } as IpcPayload);
    }
}
