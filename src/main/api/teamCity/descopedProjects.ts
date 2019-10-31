import { writeFile } from 'jsonfile';
import { TeamCityApiClient } from './shared';
import { PROJECTS_URL, DESCOPED_PROJECT_URLS } from './constants';

export class DescopedProjects {
    private teamCityApiClient: TeamCityApiClient;

    constructor(teamCityApiClient: TeamCityApiClient) {
        this.teamCityApiClient = teamCityApiClient;
    }

    public async getDescopedProjects(apiKey: string): Promise<string[]> {
        const allResults: string[] = [];
        const requests = DESCOPED_PROJECT_URLS.map(async url => {
            const results = this.teamCityApiClient.makeGetRequest(apiKey, `${PROJECTS_URL}/${url}`);
            this.addToResults(allResults, results);
        });
        await Promise.all(requests);
        writeFile('./.temp/allDescoped.json', allResults);

        return allResults;
    }

    private addToResults(allResults: any[], json: any) {
        json.projects.project.forEach((element: any) => {
            allResults.push(element.name);
        });
    }
}
