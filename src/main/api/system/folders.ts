import { dialog, OpenDialogOptions } from 'electron';

export async function selectFolder(initialLocation: string): Promise<string | null> {
    const result = await dialog.showOpenDialog({
        defaultPath: initialLocation,
        properties: [ 'openDirectory' ]
    } as OpenDialogOptions);

    if (result && result.filePaths && result.filePaths.length > 0) {
        return result.filePaths[0];
    } else {
        return null;
    }
}