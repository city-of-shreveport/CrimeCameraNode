// require basic
var express = require('express');
var router = express.Router();
var spawn = require('child_process').spawn,
  child = null;
var { startRecording, stopRecording } = require('../helperFunctions');

// require models
var videos = require('../models/videos');

// require environment
require('dotenv').config();

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
