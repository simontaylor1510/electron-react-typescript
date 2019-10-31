export interface LocalFileStatus {
    inIndex: boolean;
    inWorkingTree: boolean;
    isConflicted: boolean;
    isDeleted: boolean;
    isIgnored: boolean;
    isModified: boolean;
    isNew: boolean;
    isRenamed: boolean;
    isTypechange: boolean;
    path: string;
    status: string[];
    statusBit: number;
    isSelected: boolean;
    isSubmodule: boolean;
    isAheadSubmodule: boolean;
}