import express from 'express';
import EventRouter from './ROUTE/router.event';

const index = express();

index.use(express.json());
index.use("/api/onvif/event", EventRouter);

export default index;