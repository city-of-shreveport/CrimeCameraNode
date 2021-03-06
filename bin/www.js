#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('CrimeCameraNode:server');
var http = require('http');
var dedent = require('dedent-js');
var got = require('got');
var config = {};

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
  uploadVideos,
} = require('../helperFunctions');

require('dotenv').config();

async function getConfig() {
  console.log('Resetting firewall and routing rules...');
  await execCommand(dedent`
    sudo iptables -P INPUT ACCEPT;
    sudo iptables -P FORWARD ACCEPT;
    sudo iptables -P OUTPUT ACCEPT ;
    sudo iptables -t nat -F;
    sudo iptables -t mangle -F;
    sudo iptables -t raw -F;
    sudo iptables -F;
    sudo iptables -X;
  `);

  console.log('Getting configuration information from remote server...');
  var response = await got(`${process.env.NODE_SERVER}/api/nodes/${process.env.NODE_IDENTIFIER}`);

  config = JSON.parse(response.body).config;
}

async function executeMainProcess() {
  getConfig().then(() => {
    bootstrapApp(config).then(() => {
      

      server.listen(port);
      server.on('error', onError);
      server.on('listening', onListening);
      console.log(`App listenting on port ${port}!`);
   
      setInterval(() => {
        uploadSysInfo(config);
      }, 300000);

      setInterval(() => {
        uploadPerfMon(config);
      }, 60000);

      setInterval(() => {
        uploadVideos(config);
      }, 900000);

      uploadSysInfo(config);
      uploadPerfMon(config);
      uploadVideos(config);
     
      startRecording(config);
    });
  });
}

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

if (process.env.DEBUG == 'true') {
  executeMainProcess();
} else {
  setTimeout(() => {
    executeMainProcess();
  }, 60000);
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
