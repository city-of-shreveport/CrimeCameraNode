var {
  bootstrapApp,
  execCommand,
  formatArguments,
  mountStorageDrive,
  setupStorageDrive,
  startRecording,
  startRecordingInterval,
  stopRecording,
  stopRecordingInterval,
  uploadPerfMon,
  uploadSysInfo,
  uploadVideos
} = require('./helperFunctions');

require('dotenv').config();

startRecording()
