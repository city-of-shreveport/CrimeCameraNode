/**
 * Module dependencies.
 */
const app = require('../app');
const debug = require('debug')('CrimeCameraClient:server');
const http = require('http');
const fs = require('fs');
const socketApi = require('../socketApi');
const io = socketApi.io;
const got = require('got');
const { execSync } = require('child_process');
require('dotenv').config();

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Bootstrap and start app.
 */
bootstrapApp().then(() => {
  var server = http
    .createServer({}, app)
    .listen(port, function () {
      console.log(`App listening on port ${port}!`);
    })
    .on('error', onError);

  io.attach(server);
});

async function bootstrapApp() {
  console.log('Getting configuration information from remote server...');
  try {
    var response = await got(
      `${process.env.CAMERA_SERVER}/api/get-config?token=${process.env.API_KEY}&camera=${process.env.CAMERA_IDENTIFIER}`
    );

    try {
      var config = JSON.parse(response.body).cameraConfiguration;
    } catch (error) {
      console.log('Unable to parse configuration information. Please ensure that config is valid JSON.');
    }

    console.log('Optionally setting up and joining ZeroTier network...');
    try {
      if (config.zeroTierNetworkID) {
        execSync(
          `curl -s 'https://raw.githubusercontent.com/zerotier/ZeroTierOne/master/doc/contact%40zerotier.com.gpg' | gpg --import --quiet;
          if z=$(curl -s 'https://install.zerotier.com/' | gpg --quiet); then echo "$z" | sudo bash; fi;
          sudo chmod 755 -R /var/lib/zerotier-one;
          sudo service zerotier-one restart;
          sudo zerotier-cli join ${config.zeroTierNetworkID};`
        );
      }
    } catch (error) {}

    console.log('Idempotently setting up encryption on video storage device...');
    var driveIsEncrypted = false;

    // Check lsblk to see if the virtual partition exists.
    try {
      driveIsEncrypted = execSync(`lsblk -o NAME,TYPE,SIZE,MODEL | grep ${config.videoDriveEncryptionKey}`)
        .toString()
        .includes(config.videoDriveEncryptionKey);
    } catch (error) {}

    // If the lsblk virtual partition does not exist, check blkid to see if the drive is formatted correctly.
    try {
      if (!driveIsEncrypted) {
        driveIsEncrypted = execSync(`blkid ${config.videoDrivePath} | grep crypto_LUKS`)
          .toString()
          .includes('crypto_LUKS');
      }
    } catch (error) {}

    // Attempt to mount the virtual partition.
    try {
      if (driveIsEncrypted) {
        execSync(
          `sudo mkdir -p ${config.videoDriveMountPath};
          echo '${config.videoDriveEncryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${config.videoDrivePath} ${config.videoDriveEncryptionKey};
          sudo mount /dev/mapper/${config.videoDriveEncryptionKey} ${config.videoDriveMountPath}`
        );
      }
    } catch (error) {}

    if (driveIsEncrypted) {
      console.log('The video drive is already encrypted!');
    } else {
      // Setup and mount encrypted virtual partition.
      execSync(
        `echo '${config.videoDriveEncryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat ${config.videoDrivePath};
        echo '${config.videoDriveEncryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${config.videoDrivePath} ${config.videoDriveEncryptionKey};
        yes | sudo mkfs.ext4 -q /dev/mapper/${config.videoDriveEncryptionKey};
        sudo mkdir -p ${config.videoDriveMountPath};
        sudo mount /dev/mapper/${config.videoDriveEncryptionKey} ${config.videoDriveMountPath};
        sudo chmod 755 -R ${config.videoDriveMountPath}`
      );
    }
  } catch (error) {
    console.log('Failed to get configuration information from remote server.');
    console.log(error);
  }
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
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
