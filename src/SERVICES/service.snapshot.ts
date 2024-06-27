import DigestFetch from 'digest-fetch';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { Cam, Profile } from 'onvif';
import { join } from 'path';

export class SnapshotService {
    constructor(private cam: Cam) { }

    async getSnapshotUri(sourceToken: string): Promise<string> {
        const profiles = await this.getProfiles();
        const profile = profiles.find(profile => profile.videoSourceConfiguration.sourceToken === sourceToken);
        if (!profile) {
            throw new Error('Profile Not Found For The Given Source Token');
        }

        return new Promise((resolve, reject) => {
            this.cam.getSnapshotUri({ profileToken: profile.$.token }, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.uri);
                }
            });
        });
    }

    async downloadSnapshot(uri: string, username: string, password: string, filename: string): Promise<void> {
        const client = new DigestFetch(username, password);
        const response = await client.fetch(uri);
        if (response.ok) {
            const buffer = await response.buffer();
            const dirPath = join('./MOTION_SNAPSHOT');
            if (!existsSync(dirPath)) {
                mkdirSync(dirPath);
            }
            const filePath = join(dirPath, filename);
            writeFileSync(filePath, buffer);
        } else {
            console.error('Failed To Download Snapshot:', response.statusText);
        }
    }

    private getProfiles(): Promise<Profile[]> {
        return new Promise((resolve, reject) => {
            this.cam.getProfiles((error, profiles) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(profiles);
                }
            });
        });
    }
}
