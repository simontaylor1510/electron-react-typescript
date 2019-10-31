import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf } = format;

export class ApplicationLogger {
    public static logInfo(message: string): void {
        ApplicationLogger.logger.info(message);
    }

    public static logError(message: string, error: Error | null): void {
        if (error !== null) {
            ApplicationLogger.logger.error(message);
            if (error.message !== message) {
                ApplicationLogger.logger.error(error);
            }
        } else {
            ApplicationLogger.logger.error(message);
        }
    }

    // tslint:disable-next-line: no-shadowed-variable
    private static myFormat = printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    });

    private static logger = createLogger({
        format: combine(
            timestamp(),
            ApplicationLogger.myFormat
        ),
        level: 'info',
        transports: [
            new transports.File({ filename: 'al-developer-dashboard.log' })
        ]
    });
}
