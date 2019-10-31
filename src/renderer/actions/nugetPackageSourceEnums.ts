export enum NuGetPackageSourceActionsEnum {
    GetCurrentState = 'nugetPackageSource/GET_CURRENT_STATE',
    GetCurrentStateResult = 'nugetPackageSource/GET_CURRENT_STATE_RESULT',
    GetCurrentStateError = 'nugetPackageSource/GET_CURRENT_STATE_ERROR',
    WatchForNuGetPackageSourceChanges = 'nugetPackageSource/WATCH_FOR_PACKAGE_SOURCE_CHANGES',
    WatchingForNuGetPackageSourceChanges = 'nugetPackageSource/WATCH_FOR_PACKAGE_SOURCE_CHANGES_CONFIRMED'
}