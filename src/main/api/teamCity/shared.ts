import { SERVER_URL } from './constants';
import { FetchWrapper } from '../fetchWrapper';

export class TeamCityApiClient extends FetchWrapper {
    public async makeGetRequest(apiKey: string, url: string): Promise<any> {
        const response = await this.fetchFromHttpEndpoint(`${SERVER_URL}${url}`,
        {
            credentials: 'include',
            headers: this.generateHeaders(apiKey)
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`Status code ${response.status}(${response.statusText}) received from ${url}`);
        }
    }

    private generateHeaders(apiKey: string): Record<string, string> {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Authorization': `Basic ${apiKey}`
        };

        return headers;
    }
}
