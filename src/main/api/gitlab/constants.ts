export const API_VERSION = 'v4';

export const SERVER_URL = `http://code.europe.easyjet.local/api/${API_VERSION}`;

export const PAGE_SIZE = 100;

export const DEPRECATED_PROJECTS: string[] = [
    'AcceptanceTests',
    'bat-tool',
    'Library.ResiliencePatternTesting',
    'performance-dashboard-tool',
    'SystemAnalyzerBakFile',
    'ThirdParty.ansible'
];

export const IGNORED_PROJECT_SUFFIXES: string[] = [
    '.Behaviour',
    '.Contract'
];
