import { NuGetPackageSourceActionsEnum } from '../../../renderer/actions';
import { PackageWatcher } from './packageWatcher';
import { AppSettings } from '../../../renderer/types';

export class NuGetPackageSourceFunctions {
    private packageWatcher: PackageWatcher;

    constructor(
        appSettings: AppSettings,
        responseSender: (responseName: string, payload: any) => void,
        apiMethods: Map<string, (payload?: any) => Promise<[string, any]>>) {
        this.packageWatcher = new PackageWatcher(appSettings, responseSender);
        this.packageWatcher.watchForNuGetPackageSourceChanges();

        apiMethods.set(NuGetPackageSourceActionsEnum.GetCurrentState, async (): Promise<[string, any]> => {
            const packages = await this.packageWatcher.getCurrentContentsOfPackageSource();
            return [NuGetPackageSourceActionsEnum.GetCurrentStateResult, packages];
        });

        apiMethods.set(NuGetPackageSourceActionsEnum.WatchForNuGetPackageSourceChanges, async (): Promise<[string, any]> => {
            return [NuGetPackageSourceActionsEnum.WatchingForNuGetPackageSourceChanges, new Error('not implemented yet')];
        });

        this.packageWatcher
            .getCurrentContentsOfPackageSource()
            .then(packages => responseSender(NuGetPackageSourceActionsEnum.GetCurrentStateResult, packages));
    }
}