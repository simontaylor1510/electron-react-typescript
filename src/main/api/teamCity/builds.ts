import { writeFile } from 'jsonfile';

import { TeamCityBuild } from '../../../renderer/types';
import { IGNORED_BUILDS } from './constants';

import { EmailNotificationsListener } from '../system/emailNotificationsListener';

import { ApplicationLogger } from '../../utils/logger';
import { BuildsActionsEnum } from '../../../renderer/actions';
import { TeamCityApiClient } from './shared';
import { EventEmitter } from 'events';

// (STARTED) (Service.PassengerStandbyStatusUpdated.PerformanceTests) (Perf Test) (0.0.0-alpha)
const teamCityBuildRegexp1 = /\[TeamCity, (.+)\] Build EJ\.AbstractionLayer :: .+ :: (.+) :: (.+) #(\S+)/;
const teamCityBuildRegexp2 = /\[TeamCity, (.+)\] Build EJ\.AbstractionLayer :: .+ :: .+ :: (.+) :: (.+) #(\S+)/;
const teamCityDeployRegexp = /\[TeamCity, (\S+)\] Build EJ\.AbstractionLayer :: \S+ :: Deploy \S+ #(\S+)/;

let failedBuilds: TeamCityBuild[] = [];
let unseenCount: number = 0;

export class TeamCityBuilds extends EventEmitter {
    private teamCityApiClient: TeamCityApiClient;
    private responseSender!: (responseName: string, payload: any) => void;
    private emailNotificationsListener!: EmailNotificationsListener;

    constructor(teamCityApiClient: TeamCityApiClient) {
        super();
        this.teamCityApiClient = teamCityApiClient;
    }

    public async getFailedBuilds(apiKey: string): Promise<TeamCityBuild[]> {
        const json = await this.teamCityApiClient.makeGetRequest(
            apiKey,
            // tslint:disable-next-line: max-line-length
            '/httpAuth/app/rest/buildTypes?locator=affectedProject:(id:AbstractionLayer)&fields=buildType(id,name,href,project,builds($locator(running:false,canceled:false,count:5),build(number,status,statusText,startDate,finishDate)))');
        return this.filterFailedBuilds(json);
    }

    public resetUnseenFailedBuildCount(): void {
        unseenCount = 0;
    }

    public listenForBuildEvents(responseSender: (responseName: string, payload: any) => void): void {
        this.responseSender = responseSender;

        this.emailNotificationsListener = new EmailNotificationsListener(
            'teamcity.to.slack.bjss@gmail.com',
            'bnikmcuwlnreqfyi',
            ['tooling.team@easyjet.com'],
            this.receivedEmailCallback);

        this.emailNotificationsListener.on('connected', () => {
            ApplicationLogger.logInfo('Connected to TeamCity notification emails');
            this.responseSender('TeamCityNotifications', 'connected');
        });
        this.emailNotificationsListener.on('disconnected', () => {
            ApplicationLogger.logInfo('Disconnected from TeamCity notification emails');
            this.responseSender('TeamCityNotifications', 'disconnected');
        });
    }
        
    private receivedEmailCallback(subject: string): void {
        let matches = teamCityDeployRegexp.exec(subject);
        if (matches !== null && matches.length === 3) {
            return;
        }

        matches = teamCityBuildRegexp1.exec(subject);
        if (matches === null || matches.length !== 5) {
            matches = teamCityBuildRegexp2.exec(subject);
            if (matches === null || matches.length !== 5) {
                ApplicationLogger.logInfo(`Unexpected email subject: "${subject}"`);
            }
        }

        let refreshRequired = false;
        if (matches !== null && matches.length === 5) {
            const serviceName = matches[2];
            const reasonAndType = this.generateFailureReason(matches[3], matches[1]);

            if (matches[1] === 'SUCCESSFUL' && matches[2] !== null) {
                const count = failedBuilds.length;
                failedBuilds = failedBuilds.filter(fb => fb.serviceName !== serviceName || fb.type !== reasonAndType[2]);
                if (failedBuilds.length !== count) {
                    refreshRequired = true;
                }
            } else if (matches[1] === 'FAILED' && matches[2] !== null) {
                const failedBuild = {
                    buildId: matches[4],
                    buildName: matches[3],
                    buildNumber: matches[4],
                    displayName: `${serviceName}${matches[3] ? ` - ${matches[3]}` : ''}`,
                    finishTime: new Date().getTime(),
                    sequence: reasonAndType[1],
                    serviceName,
                    status: 'FAILED',
                    type: reasonAndType[2]
                } as TeamCityBuild;

                if (!failedBuilds.find(fb => fb.serviceName === serviceName)) {
                    failedBuilds.push(failedBuild);
                    refreshRequired = true;
                } else {
                    failedBuilds = failedBuilds.filter(fb => fb.serviceName !== serviceName || fb.type !== reasonAndType[2]);
                    failedBuilds.push(failedBuild);
                    refreshRequired = true;
                }
            }
        }

        if (refreshRequired) {
            unseenCount++;
            failedBuilds = this.cleanFailedBuilds();
            this.responseSender(BuildsActionsEnum.FailedBuildsResult, failedBuilds);
            this.responseSender(BuildsActionsEnum.UnseenCountUpdated, unseenCount);
        }
    }

    private filterFailedBuilds(json: any) {
        writeFile('./.temp/tcFailedBuildsResponse.json', json);

        failedBuilds = [];

        json.buildType.forEach((element: any) => {
            element.builds.build.forEach((build: any, index: number) => {
                if (build.status === 'FAILURE' && index === 0 && IGNORED_BUILDS.indexOf(element.project.name) === -1) {
                    const reasonAndType = this.generateFailureReason(element.name, build.statusText);

                    build.finishDate = this.reformatDate(build.finishDate);
                    const dateTime = Date.parse(build.finishDate);

                    failedBuilds.push({
                        buildId: element.id,
                        buildName: element.name,
                        buildNumber: build.number,
                        displayName: `${element.project.name}${element.name ? ` - ${element.name}` : ''}`,
                        finishTime: dateTime,
                        sequence: reasonAndType[1],
                        serviceName: element.project.name,
                        status: reasonAndType[0],
                        type: reasonAndType[2]
                    } as TeamCityBuild);
                }
            });
        });

        return this.cleanFailedBuilds();
    }

    private cleanFailedBuilds(): TeamCityBuild[] {
        failedBuilds.filter(fb => fb.type === 'Deploys').forEach(fd => {
            if (failedBuilds.filter(fb =>
                fb.type === 'Builds' &&
                fb.serviceName === fd.serviceName &&
                fb.buildNumber === fd.buildNumber).length > 0) {
                fd.status = 'Snapshot Dependency Failed';
            }
        });

        return failedBuilds.sort((fb1, fb2) => `${fb1.sequence}${fb1.serviceName}`.localeCompare(`${fb2.sequence}${fb2.serviceName}`));
    }

    private generateFailureReason(buildName: string, statusText: string): [string, number, string] {
        const regexp = /Tests failed: (\d+)( |,)/;
        const matches = regexp.exec(statusText);

        switch (buildName) {
            case 'Master Deploy':
                return ['Deploy Failed', 30, 'Deploys'];

            default:
                if (buildName.startsWith('Perf Test')) {
                    return ['Performance Tests Failed', 20, 'Performance Test Runs'];
                }
        }

        return [matches == null ? 'Build failed' : `${matches[1]} FAILED test${matches[1] === '1' ? '' : 's'}`, 10, 'Builds'];
    }

    private reformatDate(dateToReformat: string) {
        const timezoneIndex = dateToReformat.indexOf('+');
        if (timezoneIndex >= 0) {
            const colonIndex = dateToReformat.indexOf(':', timezoneIndex);
            if (colonIndex < 0) {
                dateToReformat = dateToReformat.substr(0, timezoneIndex + 3) + ':' + dateToReformat.substr(timezoneIndex + 3);
            }
        }

        if (dateToReformat.substr(4, 1) !== '-') {
            dateToReformat =
                `${dateToReformat.substr(0, 4)}-${dateToReformat.substr(4, 2)}-${dateToReformat.substr(6, 2)}${dateToReformat.substr(8)}`;
        }

        if (dateToReformat.substr(13, 1) !== ':') {
            dateToReformat =
                `${dateToReformat.substr(0, 11)}${dateToReformat.substr(11, 2)}:${dateToReformat.substr(13, 2)}:${dateToReformat.substr(15)}`;
        }

        return dateToReformat;
    }
}
