# ONVIF-EVENT-API

A simple REST API for monitoring a motion detection event that come from ONVIF device. I use an "node-onvif-event" as a core and improve its some function like a detect an event where it came from and take snapshot of it. Here you can read more about "node-onvif-event" : https://github.com/ROG3R-DEV/node-onvif-events

## Usage

Tested on Postman

- Method: POSR
- URL: http://localhost:5000/api/onvif/event/motionDetection
- Body: "addr" : "10.54.x.0", "user" : "xxxxx", "pass" : "xxxxx",

