// require basic
const router = require('express').Router();
const spawn = require('child_process').spawn,
  child = null;
const { startRecording, stopRecording } = require('../helperFunctions');

require('dotenv').config();

// require models
const videos = require('../models/videos');

router.get('/videos', async (req, res) => {
  videos.find({}, function (err, docs) {
    if (err) {
      console.log(err);
      res.send('error');
    } else {
      res.send(docs);
    }
  });
});

router.get('/recordings/start', async (req, res) => {
  startRecording();
  res.send('Recording started!');
});

router.get('/recordings/stop', async (req, res) => {
  stopRecording();
  res.send('Recording stopped!');
});

module.exports = router;
