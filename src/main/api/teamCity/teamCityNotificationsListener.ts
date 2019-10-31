import { RTMClient } from '@slack/client';

import { ApplicationLogger } from '../../utils/logger';

// (STARTED) (Service.PassengerStandbyStatusUpdated.PerformanceTests) (Perf Test) (0.0.0-alpha)
const teamCityBuildRegexp1 = /\[TeamCity, (\S+)\] Build EJ\.AbstractionLayer :: \S+ :: (\S+) :: (.+) #(\S+)/;
const teamCityBuildRegexp2 = /\[TeamCity, (\S+)\] Build EJ.AbstractionLayer :: \S+ :: \S+ :: (\S+) :: (.+) #(\S+)/;

export class SlackMessageListener {
    private client: RTMClient;

    constructor() {
        this.client = new RTMClient('xoxb-243152311041-489397498276-Iex8lLGavjqs4YXP187OMJ1o');

        try {
            this.client.on('connecting', () => {
                ApplicationLogger.logInfo('Connecting to Slack');
            });
            this.client.on('connected', () => {
                ApplicationLogger.logInfo('Connected to Slack');
            });
            this.client.on('message', (message: any) => {
                let matches = teamCityBuildRegexp1.exec(message.text);
                if (matches !== null && matches.length === 5) {
                    ApplicationLogger.logInfo(`${matches[2]} (${matches[3]}) - ${matches[4]}: ${matches[1]}`);
                } else {
                    matches = teamCityBuildRegexp2.exec(message.text);
                    if (matches !== null && matches.length === 5) {
                        ApplicationLogger.logInfo(`${matches[2]} (${matches[3]}) - ${matches[4]}: ${matches[1]}`);
                    } else {
                        ApplicationLogger.logInfo(message.text);
                    }
                }
            });
            this.client.on('error', (error) => {
                ApplicationLogger.logInfo(JSON.stringify(error));
            });
            this.client.start().then(_ => {
                ApplicationLogger.logInfo('Slack client started');
            });
        } catch (error) {
            ApplicationLogger.logError(error.message, error);
        }
    }
}