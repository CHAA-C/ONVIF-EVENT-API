declare module 'onvif' {
    import { EventEmitter } from 'events';

    export type ConnectionCallback = (error?: Error) => void;

    export interface NotificationMessage {
        topic: { _: string };
        message: {
            message: {
                $: object;
                source: {
                    simpleItem: SimpleItem | SimpleItem[];
                };
                data: {
                    simpleItem: SimpleItem | SimpleItem[];
                };
            };
        };
    }

    interface SimpleItem {
        $: {
            Name: string;
            Value: string | boolean;
        };
    }

    export interface EventDevice {
        hostname: string;
        username: string;
        password: string;
        port?: number;
    }

    interface Configuration {
        name: string;
        sourceToken: string;
        [key: string]: any;
    }

    export interface Profile {
        $: { token: string };
        name: string;
        videoSourceConfiguration: Configuration;
        [key: string]: any;
    }

    export interface SnapshotUri {
        uri: string;
    }

    export class Cam extends EventEmitter {
        username: string;
        password: string;

        constructor(device: EventDevice, callback: ConnectionCallback);
        connect(callback: ConnectionCallback): void;
        on(event: 'event', listener: (message: NotificationMessage) => void): this;
        getProfiles(callback: (error: Error | null, profiles: Profile[]) => void): void;
        getSnapshotUri(params: { profileToken: string }, callback: (error: Error | null, result: SnapshotUri) => void): void;
    }
}
