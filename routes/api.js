// require basic
var express = require('express');
var router = express.Router();
var { startRecording, stopRecording } = require('../helperFunctions');

router.get('/recordings/start', async (req, res) => {
  startRecording();
  res.send('Recording started!');
});

router.get('/recordings/stop', async (req, res) => {
  stopRecording();
  res.send('Recording stopped!');
});

module.exports = router;
