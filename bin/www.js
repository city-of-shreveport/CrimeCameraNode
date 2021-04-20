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
 * Bootstrap and start app.
 */
bootstrapApp().then(() => {
  app.set('port', normalizePort(process.env.PORT || '3000'));

  var server = http
    .createServer({}, app)
    .listen(3000, function () {
      console.log('App listening on port 3000!');
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

    var config = JSON.parse(JSON.parse(response.body));

    console.log('Idempotently setting up encryption on video storage device...');
    let driveIsEncrypted = execSync(`lsblk -o NAME,TYPE,SIZE,MODEL | grep ${config.videoDriveEncryptionKey}`)
      .toString()
      .includes(config.videoDriveEncryptionKey);

    if (driveIsEncrypted) {
      console.log('The video drive is already encrypted!');
    } else {
      execSync(
        `
        echo '${config.videoDriveEncryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat /dev/sda1;
        echo '${config.videoDriveEncryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen /dev/sda1 ${config.videoDriveEncryptionKey};
        yes | sudo mkfs.ext4 -q /dev/mapper/${config.videoDriveEncryptionKey};
        sudo mount /dev/mapper/${config.videoDriveEncryptionKey} /home/pi/CrimeCameraClient/public/videos;
        sudo chmod 755 -R /home/pi/CrimeCameraClient/public/videos;
      `,
        (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        }
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
