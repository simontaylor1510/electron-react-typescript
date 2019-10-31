import * as Pusher from 'pusher-js';

import { ApplicationLogger } from '../../utils/logger';

import { GitProjects } from './projects';
import { LocalProjectStatusTypeEnum } from '../../../renderer/types';
import { ProjectsActionsEnum } from '../../../renderer/actions/projectEnums';
import { LocalProjectStatusResult } from '../../../renderer/types/localProjectStatus';

const projectNameRegexp = /\[Git\]\[(\S+)\/(\S+)\]\[(\S+)\].*/;

export class NotificationsListener {
    private responseSender: (responseName: string, payload: any) => void;
    private gitProjects: GitProjects;

    constructor(responseSender: (responseName: string, payload: any) => void, gitProjects: GitProjects) {
        this.responseSender = responseSender;
        this.gitProjects = gitProjects;

        const pusher = new Pusher('fee12085e2701db41d79', {
            cluster: 'eu'
        });

        const channel = pusher.subscribe('gitlab_notifications');

        channel.bind('gitlab_notification', async (data: any) => {
            const matches = projectNameRegexp.exec(data.subject);
            if (matches !== null && matches.length === 4 && matches[3] === 'master') {
                ApplicationLogger.logInfo(`A commit was pushed to ${matches[2]}`);
                const directoryName = this.gitProjects.GetDirectoryNameFromName(matches[2]);
                if (directoryName.isSome) {
                    const localProject = await this.gitProjects.GetLocalProjectStatus(directoryName.unwrap());
                    this.responseSender(ProjectsActionsEnum.LocalProjectStatus, {
                        isBackground: false,
                        isBatchOperation: false,
                        localProject,
                        statusType: LocalProjectStatusTypeEnum.GitlabNotification
                    } as LocalProjectStatusResult);
                }
            }
        }, this);
    }
}