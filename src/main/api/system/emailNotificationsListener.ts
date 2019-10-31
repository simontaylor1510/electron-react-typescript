import * as Imap from 'imap';

import { ApplicationLogger } from '../../utils/logger';
import { delay } from '../../utils/async';

const FromBody = 'HEADER.FIELDS (FROM)';
const FromPrefix = 'From:';
const SubjectBody = 'HEADER.FIELDS (SUBJECT)';
const SubjectPrefix = 'Subject:';

export async function listenForEmails(
    emailAddress: string,
    password: string,
    fromAddresses: string[],
    callback: (subject: string) => void,
    reconnectDelay: number = 1000) {

    const imap: Imap = new Imap({
        host: 'imap.gmail.com',
        keepalive: true,
        password,
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false
        },
        user: emailAddress
    } as Imap.Config);

    let closed = false;
    let errored = false;
    let inbox: Imap.Box;

    async function reconnect() {
        if (!closed) {
            try {
                imap.closeBox(err => {
                    ApplicationLogger.logError(`Failed to close INBOX for ${emailAddress}`, err);
                });
            }
            finally {
                imap.destroy();
                closed = true;
            }
        }
        await delay(reconnectDelay);
        reconnectDelay = reconnectDelay * 2;
        listenForEmails(emailAddress, password, fromAddresses, callback, reconnectDelay);
    }

    try {
        imap.once('ready', () => {
            imap.openBox('INBOX', true, (_: Error, mailbox: Imap.Box) => {
                inbox = mailbox;
                ApplicationLogger.logInfo(`Opened INBOX for ${emailAddress}`);
                reconnectDelay = 1000;
                imap.on('mail', (messages: number) => {
                    const subscription = imap.seq.fetch([`${inbox.messages.total - messages + 1}:*`], {
                        bodies: [FromBody, SubjectBody],
                        struct: true
                    });
                    subscription.on('message', (message: Imap.ImapMessage, __: number) => {
                        const values: Map<string, string> = new Map<string, string>();
                        message.on('body',
                            (stream: NodeJS.ReadableStream, info: Imap.ImapMessageBodyInfo) => {
                                processMessageBody(stream, values, info, fromAddresses, callback);
                            });
                    });
                });
            });
        });

        imap.once('error', async (error: Error) => {
            errored = true;
            ApplicationLogger.logError(`${emailAddress} - IMAP error - disconnecting`, error);
            reconnect();
        });

        imap.once('close', async (hadError: boolean) => {
            if (!closed) {
                closed = true;
                if (!errored) {
                    ApplicationLogger.logInfo(`${emailAddress} - Connection closed.  HadError: ${hadError}`);
                    reconnect();
                }
            }
        });

        imap.once('end', async () => {
            if (!closed && !errored) {
                ApplicationLogger.logInfo(`${emailAddress} - connection to IMAP server lost`);
                reconnect();
            }
        });

        imap.connect();
    } catch (error) {
        ApplicationLogger.logError(`${emailAddress} - Error receiving messages for ${emailAddress}`, error);
        reconnect();
    }
}

function processMessageBody(
    stream: NodeJS.ReadableStream,
    values: Map<string, string>,
    info: Imap.ImapMessageBodyInfo,
    fromAddresses: string[],
    callback: (subject: string) => void): void {
    let prefix: string = '';
    switch (info.which) {
        case FromBody:
            prefix = FromPrefix;
            break;

        case SubjectBody:
            prefix = SubjectPrefix;
            break;
    }

    stream.on('data', (chunk: string) => {
        if (values.has(prefix)) {
            values.set(prefix, values.get(prefix) + chunk.toString());
        } else {
            values.set(prefix, chunk.toString());
        }
    });

    stream.on('end', () => {
        if (values.has(prefix)) {
            let value = values.get(prefix);
            if (value) {
                value = value.replace(/\r\n/g, '').replace(/\n/g, '');
                if (value.startsWith(prefix)) {
                    values.set(prefix, value.substring(prefix.length).trim());
                }
                if (values.has(FromPrefix) && values.has(SubjectPrefix)) {
                    const from = values.get(FromPrefix);
                    const subject = values.get(SubjectPrefix);
                    if (from && subject && subject.length > 0) {
                        if (fromAddresses.filter(fa => from.toLocaleLowerCase().indexOf(fa.toLocaleLowerCase())).length > 0) {
                            callback(subject.replace(/\r\n/g, '').replace(/\n/g, ''));
                        }
                    }
                }
            }
        }
    });
}