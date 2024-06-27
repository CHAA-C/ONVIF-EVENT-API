import * as ONVIFMotion from '../SERVICES/service.motion';
import { RequestHandler } from 'express';
import { ONVIFConfigs } from '../UTILITIES/camera.configs';
import { Device } from '../@TYPES/device';

// GET BANGKOK TIME
function getDateInBangkok(): string {
    return new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
}

// MONITOR MOTION EVENT
export const monitorMotionEvent: RequestHandler = async (req, res) => {
    const { addr, user, pass } = req.body;

    if (!addr || !user || !pass) {
        return res.status(400).send({ message: 'Some Field Is Missing...' });
    }

    const configs: ONVIFConfigs = { addr, user, pass };
    const device: Device = {
        hostname: configs.addr,
        username: configs.user,
        password: configs.pass,
        port: 80,
    };

    try {
        const motionEvent = await ONVIFMotion.MotionDetection.create(device);

        console.log(getDateInBangkok(), '>>> Starting Motion Detection...');

        motionEvent.listen((motion, topic, channel) => {
            if (motion) {
                console.log(getDateInBangkok(), `>>> Motion Detected: ${motion} On Topic: ${topic} From Camera: ${channel}`);
            } else {
                console.log(getDateInBangkok(), '>>> No Motion Detected...');
            }
        });

    } catch (error) {
        console.error('Error setting up motion detection:', error);
        res.status(500).send({ message: 'Failed To Start Motion Detection...', error: error });
    }
};
