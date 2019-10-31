import { SERVER_URL, PAGE_SIZE } from './constants';
import { FetchWrapper } from '../fetchWrapper';

export class GitLabApiClient extends FetchWrapper {
    public async makePagedGetRequest(apiToken: string, url: string): Promise<any> {
        let currentPage = 1;
        let added = 0;
        let allData: any[] = [];

        do {
            const pagingUrl = this.addPagingToUrl(url, currentPage);
            const response = await this.fetchFromHttpEndpoint(`${SERVER_URL}${pagingUrl}`, {
                headers: this.generateHeaders(apiToken)
            });
            if (response.ok) {
                const data = (await response.json()) as any[];
                added = data.length;
                allData = allData.concat(data);
            } else {
                throw new Error(`Status code ${response.status}(${response.statusText}) received from ${SERVER_URL}${url}`);
            }
            currentPage++;
        } while (added === PAGE_SIZE);

        return allData;
    }

    public async makeGetRequest(apiToken: string, url: string): Promise<any> {
        const response = await this.fetchFromHttpEndpoint(`${SERVER_URL}${url}`, { headers: this.generateHeaders(apiToken) });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`Status code ${response.status}(${response.statusText}) received from ${SERVER_URL}${url}`);
        }
    }

    private generateHeaders(apiToken: string): Record<string, string> {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'PRIVATE-TOKEN': apiToken
        };

        return headers;
    }

    private addPagingToUrl(url: string, currentPage: number): string {
        let extraParametersSuffix = '?';
        if (url.indexOf('?') >= 0) {
            extraParametersSuffix = '&';
        }

        return `${url}${extraParametersSuffix}page=${currentPage}&per_page=${PAGE_SIZE}`;
    }
}
