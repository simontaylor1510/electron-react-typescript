import * as fs from 'async-file';
import { watch } from 'async-file';
import { AppSettings, NuGetPackageDetails } from '../../../renderer/types';
import { NuGetPackageSourceActionsEnum } from '../../../renderer/actions';

export class PackageWatcher {
    private appSettings: AppSettings;
    private responseSender: (responseName: string, payload: any) => void;
    private logFilename: string;
    private lastChange: number | undefined;

    constructor(
        appSettings: AppSettings,
        responseSender: (responseName: string, payload: any) => void) {
        this.appSettings = appSettings;
        this.responseSender = responseSender;
        this.logFilename = `${appSettings.userDataFolder}\\nugetPackagesWatcher.txt`;
        fs.exists(this.logFilename).then(async exists => {
            if (exists) {
                await fs.delete(this.logFilename);
            }
        });
    }

    // tslint:disable-next-line: no-empty
    public async watchForNuGetPackageSourceChanges(): Promise<void> {
        await this.LogStatusMessage(`started watching ${this.appSettings.localNuGetPackageSourceFolder}`);

        setInterval(async () => {
            await this.ProcessChanges(this.responseSender);
        }, 500);

        // tslint:disable-next-line: no-empty
        await watch(this.appSettings.localNuGetPackageSourceFolder, { recursive: false }, async (fileEvent, filename) => {
            this.lastChange = Date.now();
        });
    }

    public async getCurrentContentsOfPackageSource(): Promise<NuGetPackageDetails[]> {
        return Promise.resolve([

        ] as NuGetPackageDetails[]);
    }

    private async ProcessChanges(_: any) {
        if (this.lastChange) {
            if (Date.now() - this.lastChange > 500) {
                this.LogStatusMessage(`Changes have occurred, but not since ${new Date(this.lastChange).toLocaleTimeString()}`);
                this.lastChange = undefined;
                this.responseSender(NuGetPackageSourceActionsEnum.GetCurrentStateResult, this.getCurrentContentsOfPackageSource);
            }
        }
    }

    private async LogStatusMessage(message: string) {
        await fs.appendFile(this.logFilename, `${new Date().toISOString()}: ${message}\r\n`);
    }
}