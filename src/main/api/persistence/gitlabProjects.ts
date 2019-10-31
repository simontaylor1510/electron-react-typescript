import { writeFileSync, existsSync, readFileSync } from 'fs';

import { Project } from '../../../renderer/types';
import { ApplicationLogger } from '../../utils/logger';

export class ServerProjectsPersistence {
    private userDataPath: string;
    private serverProjectsPath: string;

    constructor(userDataPath: string) {
        this.userDataPath = userDataPath;
        this.serverProjectsPath = `${this.userDataPath}\\serverProjects.json`;
    }

    public loadServerProjects(): Project[] {
        if (!existsSync(this.serverProjectsPath)) {
            return [];
        }

        try {
            const json = readFileSync(this.serverProjectsPath, '') as string;
            return JSON.parse(json);
        } catch (error) {
            ApplicationLogger.logError(`Failed to load from ${this.serverProjectsPath}`, error);
        }

        return [];
    }

    public async saveServerProjects(localProjects: Project[]): Promise<void> {
        ApplicationLogger.logInfo(`${Array.from(localProjects.keys()).length} REMOTE projects persisted to disk`);
        writeFileSync(this.serverProjectsPath, JSON.stringify(localProjects));
    }
}