export interface TeamCityBuild {
    buildId: string;
    finishTime: number;
    displayName: string;
    serviceName: string;
    buildName: string;
    buildNumber: string;
    status: string;
    sequence: number;
    type: string;
}