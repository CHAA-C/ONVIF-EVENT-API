import * as ONVIFMotion from "../CONTROLLER/controller.motion";
import { Router } from "express";

const router = Router();

router.post("/motionDetection", ONVIFMotion.monitorMotionEvent);

export default router;