import fetch from 'cross-fetch';

export abstract class FetchWrapper {
    private hostUnreachcable: boolean = false;
    private unauthorized = false;

    public async fetchFromHttpEndpoint(input: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
        const request = input.toString();
        let url;
        if (request) {
            const index = request.indexOf('?');
            url = index >= 0 ? request.substring(0, index) : request;
        }
        if (this.hostUnreachcable) {
            throw new Error(`Host is unreachable (${url}) - please use resetErrors method to prevent repeated failures`);
        }
        if (this.unauthorized) {
            throw new Error(`Invalid credentials for (${url}) - please use resetErrors method to prevent repeated failures`)
        }
        try {
            const response = await fetch(input, init);

            if (response.status === 401) {
                this.unauthorized = true;
                throw new Error(`Invalid credentials for (${url}) - please use resetErrors method to prevent repeated failures`)
            }

            return response;
        } catch (error) {
            if (error.errno === 'ENOTFOUND') {
                this.hostUnreachcable = true;
                throw new Error(`Host is unreachable (${url}) - please use resetErrors method to prevent repeated failures`);
            }
            throw error;
        }
    }

    public resetErrors(): void {
        this.hostUnreachcable = false;
        this.unauthorized = false;
    }
}