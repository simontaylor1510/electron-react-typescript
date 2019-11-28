import * as Imap from 'imap';

import { ApplicationLogger } from '../../utils/logger';
import { delay } from '../../utils/async';
import { EventEmitter } from 'events';

const FromBody = 'HEADER.FIELDS (FROM)';
const FromPrefix = 'From:';
const SubjectBody = 'HEADER.FIELDS (SUBJECT)';
const SubjectPrefix = 'Subject:';

export class EmailNotificationsListener extends EventEmitter {
    private _imap!: Imap;
    private _emailAddress: string;
    private _password: string;
    private _fromAddresses: string[];
    private _callback: (subject: string) => void;
    private _connected: boolean = true;
    private _closed: boolean;
    private _reconnectDelay: number;
    private _errored: boolean;
    private _inbox!: Imap.Box;

    constructor(
        emailAddress: string,
        password: string,
        fromAddresses: string[],
        callback: (subject: string) => void,
        reconnectDelay: number = 1000) {

        super();

        this._emailAddress = emailAddress;
        this._password = password;
        this._fromAddresses = fromAddresses;
        this._callback = callback;
        this._closed = true;
        this._reconnectDelay = reconnectDelay;
        this._errored = false;

        this.listenForEmails();
    }

    private async listenForEmails(): Promise<void> {
        this._imap = new Imap({
            host: 'imap.gmail.com',
            keepalive: true,
            password: this._password,
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            },
            user: this._emailAddress
        } as Imap.Config);

        try {
            this._imap.once('ready', () => {
                this._imap.openBox('INBOX', true, (_: Error, mailbox: Imap.Box) => {
                    this._connected = true;
                    this.emit('connected');
                    this._inbox = mailbox;
                    ApplicationLogger.logInfo(`Opened INBOX for ${this._emailAddress}`);
                    this._reconnectDelay = 1000;
                    this._imap.on('mail', (messages: number) => {
                        const subscription = this._imap.seq.fetch([`${this._inbox.messages.total - messages + 1}:*`], {
                            bodies: [FromBody, SubjectBody],
                            struct: true
                        });
                        subscription.on('message', (message: Imap.ImapMessage, __: number) => {
                            const values: Map<string, string> = new Map<string, string>();
                            message.on('body',
                                (stream: NodeJS.ReadableStream, info: Imap.ImapMessageBodyInfo) => {
                                    this.processMessageBody(stream, values, info);
                                });
                        });
                    });
                });
            });

            this._imap.once('error', async (error: Error) => {
                this._errored = true;
                ApplicationLogger.logError(`${this._emailAddress} - IMAP error - disconnecting`, error);
                this.reconnect();
            });

            this._imap.once('close', async (hadError: boolean) => {
                if (!this._closed) {
                    this._closed = true;
                    if (!this._errored) {
                        ApplicationLogger.logInfo(`${this._emailAddress} - Connection closed.  HadError: ${hadError}`);
                        this.reconnect();
                    }
                }
            });

            this._imap.once('end', async () => {
                if (!this._closed && !this._errored) {
                    ApplicationLogger.logInfo(`${this._emailAddress} - connection to IMAP server lost`);
                    this.reconnect();
                }
            });

            this._imap.connect();
        } catch (error) {
            ApplicationLogger.logError(`${this._emailAddress} - Error receiving messages for ${this._emailAddress}`, error);
            this.reconnect();
        }
    }

    private async reconnect(): Promise<void> {
        if (this._connected) {
            this._connected = false;
            this.emit('disconnected');
        }

        if (!this._closed && this._imap) {
            try {
                if (this._imap.state == 'connected') {
                    this._imap.closeBox(err => {
                        ApplicationLogger.logError(`Failed to close INBOX for ${this._emailAddress}`, err);
                    });
                }
            }
            finally {
                try {
                    this._imap.destroy();
                } finally {
                    this._closed = true;
                }
            }
        }

        await delay(this._reconnectDelay);
        this._reconnectDelay = this._reconnectDelay * 2;
        this.listenForEmails();
    }

    private processMessageBody(
        stream: NodeJS.ReadableStream,
        values: Map<string, string>,
        info: Imap.ImapMessageBodyInfo): void {
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
                            if (this._fromAddresses.filter(fa => from.toLocaleLowerCase().indexOf(fa.toLocaleLowerCase())).length > 0) {
                                this._callback(subject.replace(/\r\n/g, '').replace(/\n/g, ''));
                            }
                        }
                    }
                }
            }
        });
    }
}
