// require basic
const express = require('express');
const router = express.router();
const spawn = require('child_process').spawn,
  child = null;

// require models
const Videos = require('../models/videos');

Router.get('/videos', async (req, res) => {
  Videos.find({}, function (err, docs) {
    if (err) {
      console.log(err);
      res.send('error');
    } else {
      res.send(docs);
    }
  });
});

Router.get('/recording/start', async (req, res) => {
  cameraRecording1 = spawn('ffmpeg', [
    '-hide_banner',
    '-i',
    'rtsp://admin:UUnv9njxg@10.10.5.2:554/cam/realmonitor?channel=1&subtype=0',
    '-vcodec',
    'copy',
    '-f',
    'segment',
    '-strftime',
    '1',
    '-segment_time',
    '300',
    '-segment_format',
    'mp4',
    '/home/pi/videos/camera1/%Y-%m-%d_%H-%M.mp4',
  ]);

  cameraRecording1.stdout.on('data', (data) => {});
  cameraRecording1.stderr.on('data', (data) => {});

  cameraRecording2 = spawn('ffmpeg', [
    '-hide_banner',
    '-i',
    'rtsp://admin:UUnv9njxg@10.10.5.3:554/cam/realmonitor?channel=1&subtype=0',
    '-vcodec',
    'copy',
    '-f',
    'segment',
    '-strftime',
    '1',
    '-segment_time',
    '300',
    '-segment_format',
    'mp4',
    '/home/pi/videos/camera2/%Y-%m-%d_%H-%M.mp4',
  ]);

  cameraRecording2.stdout.on('data', (data) => {});
  cameraRecording2.stderr.on('data', (data) => {});

  cameraRecording3 = spawn('ffmpeg', [
    '-hide_banner',
    '-i',
    'rtsp://admin:UUnv9njxg@10.10.5.4:554/cam/realmonitor?channel=1&subtype=0',
    '-vcodec',
    'copy',
    '-f',
    'segment',
    '-strftime',
    '1',
    '-segment_time',
    '300',
    '-segment_format',
    'mp4',
    '/home/pi/videos/camera3/%Y-%m-%d_%H-%M.mp4',
  ]);

  cameraRecording3.stdout.on('data', (data) => {});
  cameraRecording3.stderr.on('data', (data) => {});
});

module.exports = Router;
