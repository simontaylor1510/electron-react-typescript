import { LocalProject } from './localProject';

export enum LocalProjectStatusTypeEnum {
    None = 0,
    Cloning = 1,
    Removing = 2,
    Updating = 3,
    Cleaning = 4,
    Deleted = 97,
    FileEvent = 98,
    GitlabNotification = 99
}

export interface LocalProjectStatusResult {
    batchOperationItem: string | null;
    isBackground: boolean;
    isBatchOperation: boolean;
    isFileSystemEventNotification: boolean;
    localProject: LocalProject | null;
    statusType: LocalProjectStatusTypeEnum;
}
