import { Cam, NotificationMessage, EventDevice } from 'onvif';
import { SnapshotService } from './service.snapshot';
import { format } from 'date-fns';

const TOPICS = ['tns1:RuleEngine/CellMotionDetector/Motion'];

export class MotionDetection {
    private lastIsMotion = false;
    private profileMap = new Map<string, string[]>();
    private snapshotService: SnapshotService;
    private motionInterval: NodeJS.Timeout | null = null;
    private isSnapshotting = false;

    private constructor(private cam: Cam, private topics: string[]) {
        this.snapshotService = new SnapshotService(cam);
    }

    static async create(devices: EventDevice, topics: string[] = TOPICS): Promise<MotionDetection> {
        return new Promise((resolve, reject) => {
            const cam = new Cam(devices, async (error) => {
                if (error) {
                    reject(error);
                } else {
                    try {
                        const monitor = new MotionDetection(cam, topics);
                        await monitor.loadProfiles();
                        resolve(monitor);
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        });
    }

    private async loadProfiles(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.cam.getProfiles((error, profiles) => {
                if (error) {
                    reject(error);
                } else {
                    profiles.forEach(profile => {
                        const sourceToken = profile.videoSourceConfiguration.sourceToken;
                        if (sourceToken) {
                            if (!this.profileMap.has(sourceToken)) {
                                this.profileMap.set(sourceToken, []);
                            }
                            this.profileMap.get(sourceToken)?.push(profile.name);
                        } else {
                            console.error(`Profile ${profile.name} Does Not Have A Source Token`);
                        }
                    });
                    resolve();
                }
            });
        });
    }

    private extractChannelName(profiles: string[]): string {
        const channelNumbers = profiles
            .map(profile => profile.match(/Channel(\d+)/)?.[1])
            .filter(channel => channel !== null);

        const uniqueChannels = Array.from(new Set(channelNumbers));
        return uniqueChannels.length === 1 ? `Channel ${uniqueChannels[0]}` : 'Unknown Channel';
    }

    listen(onMotion: (motion: boolean, topic: string, channel: string) => void): void {
        this.cam.on('event', async (message: NotificationMessage) => {
            if (this.topics.includes(message?.topic?._)) {
                const simpleItem = Array.isArray(message.message.message.data.simpleItem)
                    ? message.message.message.data.simpleItem[0]
                    : message.message.message.data.simpleItem;
                const motion = simpleItem?.$?.Value as boolean;
                const sourceItem = Array.isArray(message.message.message.source?.simpleItem)
                    ? message.message.message.source?.simpleItem.find(item => item.$.Name === 'VideoSourceConfigurationToken')
                    : message.message.message.source?.simpleItem;
                const sourceToken = sourceItem?.$?.Value as string;
                const profiles = this.profileMap.get(sourceToken) || ['Unknown'];
                const channel = this.extractChannelName(profiles);

                if (motion !== this.lastIsMotion) {
                    this.lastIsMotion = motion;
                    onMotion(motion, message.topic._, channel);

                    if (motion) {
                        await this.takeSnapshot(sourceToken, channel);
                        this.startSnapshotInterval(sourceToken, channel);
                    } else {
                        this.stopSnapshotInterval();
                    }
                }
            }
        });
    }

    private async takeSnapshot(sourceToken: string, channel: string): Promise<void> {
        if (this.isSnapshotting) return;

        this.isSnapshotting = true;
        try {
            const uri = await this.snapshotService.getSnapshotUri(sourceToken);
            const fileName = this.generateFileName(channel);
            await this.snapshotService.downloadSnapshot(uri, this.cam.username, this.cam.password, fileName);
        } catch (error) {
            console.error('Error Fetching Snapshot URI:', error);
        } finally {
            this.isSnapshotting = false;
        }
    }

    private startSnapshotInterval(sourceToken: string, channel: string): void {
        this.stopSnapshotInterval();
        this.motionInterval = setInterval(() => {
            this.takeSnapshot(sourceToken, channel);
        }, 250);
    }

    private stopSnapshotInterval(): void {
        if (this.motionInterval) {
            clearInterval(this.motionInterval);
            this.motionInterval = null;
        }
    }

    private generateFileName(channel: string): string {
        const date = format(new Date(), 'yyyyMMdd_HHmmss');
        const sanitizedChannel = channel.replace(/[^a-zA-Z0-9]/g, '_');
        return `${date}_Motion_${sanitizedChannel}.jpg`;
    }

    close(): void {
        this.stopSnapshotInterval();
        this.cam.removeAllListeners('event');
    }
}
