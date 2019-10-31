import { writeFileSync, existsSync, readFileSync } from 'fs';

import { LocalProject } from '../../../renderer/types';
import { ApplicationLogger } from '../../utils/logger';

export class LocalProjectsPersistence {
    private userDataPath: string;
    private localProjectsPath: string;

    constructor(userDataPath: string) {
        this.userDataPath = userDataPath;
        this.localProjectsPath = `${this.userDataPath}\\localProjectsData.json`;
    }

    public loadLocalProjects(): Map<string, LocalProject> {
        if (!existsSync(this.localProjectsPath)) {
            return new Map<string, LocalProject>();
        }

        try {
            const json = readFileSync(this.localProjectsPath, '') as string;
            const projects = new Map<string, LocalProject>(JSON.parse(json));
            return projects;
        } catch (error) {
            ApplicationLogger.logError(`Failed to load from ${this.localProjectsPath}`, error);
        }

        return new Map<string, LocalProject>();
    }

    public async saveLocalProjects(localProjects: Map<string, LocalProject>): Promise<void> {
        ApplicationLogger.logInfo(`${Array.from(localProjects.keys()).length} LOCAL projects persisted to disk`);
        writeFileSync(this.localProjectsPath, JSON.stringify([...localProjects]));
    }
}
