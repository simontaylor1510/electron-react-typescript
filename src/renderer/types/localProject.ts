import { LocalFileStatus, Commit } from '.';

export interface LocalProject {
    ahead: number;
    behind: number;
    commitSha: string;
    currentBranch: string;
    directoryName: string;
    httpUrl: string;
    lastUpdated: number;
    lastServerCommit: Commit;
    name: string;
    selected: boolean;
    sshUrl: string;
    status: LocalFileStatus[];
    localCommits: string[];
    unpulledRemoteCommits: boolean;
    canBeCleaned: boolean;
}
