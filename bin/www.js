/**
 * Module dependencies.
 */
const app = require('../app');
const debug = require('debug')('CrimeCameraNode:server');
const http = require('http');
const fs = require('fs');
const got = require('got');
const { exec } = require('child_process');
require('dotenv').config();
const dedent = require('dedent-js');

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '80');
app.set('port', port);

/**
 * Bootstrap and start app.
 */
bootstrapApp().then(() => {
  const socketApi = require('../socketApi');
  const io = socketApi.io;

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

    var config = JSON.parse(response.body).cameraConfiguration;

    if (config.zeroTierNetworkID) {
      console.log('Joining ZeroTier network...');
      await execCommand(dedent`
        curl -s https://install.zerotier.com | sudo bash;
        sudo zerotier-cli join ${config.zeroTierNetworkID};
        sudo chmod 755 -R /var/lib/zerotier-one;
        sudo service zerotier-one restart;
      `);
    }

    await execCommand(dedent`
      sudo iptables -P INPUT ACCEPT &&
      sudo iptables -P FORWARD ACCEPT &&
      sudo iptables -P OUTPUT ACCEPT  &&
      sudo iptables -t nat -F &&
      sudo iptables -t mangle -F &&
      sudo iptables -t raw -F &&
      sudo iptables -F &&
      sudo iptables -X &&
      sudo sysctl net.ipv4.conf.eth1.forwarding=1 &&
      sudo sysctl net.ipv4.conf.wlan0.forwarding=1 &&
      sudo sysctl net.ipv4.conf.ztuga7sx7i.forwarding=1 &&
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 554 -j DNAT --to 10.10.5.2:554 &&
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 554 -j ACCEPT  &&
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 81 -j DNAT --to 10.10.5.2:80 &&
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 80 -j ACCEPT  &&
      sudo iptables -t nat -A POSTROUTING -j MASQUERADE &&
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 555 -j DNAT --to 10.10.5.3:554 &&
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 555 -j ACCEPT  &&
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 82 -j DNAT --to 10.10.5.3:80 &&
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 81 -j ACCEPT  &&
      sudo iptables -t nat -A POSTROUTING -j MASQUERADE &&
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 556 -j DNAT --to 10.10.5.4:554 &&
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 556 -j ACCEPT  &&
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 83 -j DNAT --to 10.10.5.4:80 &&
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 82 -j ACCEPT  &&
      sudo iptables -t nat -A POSTROUTING -j MASQUERADE
    `);

    console.log('Idempotently setting up encryption on video storage devices...');
    await setupStorageDrive(config.videoDriveDevicePath, config.videoDriveMountPath, config.videoDriveEncryptionKey);
    await setupStorageDrive(config.buddyDriveDevicePath, config.buddyDriveMountPath, config.buddyDriveEncryptionKey);

    await execCommand(`sudo mkdir -p /home/pi/videos/cam1;`);
    await execCommand(`sudo mkdir -p /home/pi/videos/cam2;`);
    await execCommand(`sudo mkdir -p /home/pi/videos/cam3;`);
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

/**
 * Helper functions.
 */
async function setupStorageDrive(devicePath, mountPath, encryptionKey) {
  var driveIsEncrypted = false;
  var driveIsFormatted = false;

  // Check lsblk to see if the virtual partition exists.
  driveIsEncrypted = await execCommand(dedent`lsblk -o NAME,TYPE,SIZE,MODEL | grep ${encryptionKey}`)
    .toString()
    .includes(encryptionKey);

  // If the lsblk virtual partition does not exist, check blkid to see if the drive is formatted correctly.
  if (!driveIsEncrypted) {
    driveIsFormatted = await execCommand(`blkid ${devicePath} | grep crypto_LUKS`).toString().includes('crypto_LUKS');
    if (!driveIsFormatted) {
      console.log(`Formatting drive with key ${encryptionKey}...`);
      await execCommand(dedent`echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat ${devicePath}`);
    }
  }

  if (driveIsEncrypted) {
    // Attempt to mount the virtual partition.
    await execCommand(dedent`
      sudo mkdir -p ${mountPath};
      echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
      sudo mount /dev/mapper/${encryptionKey} ${mountPath}
    `);
  } else {
    // Open and mount encrypted virtual partition.
    await execCommand(
      dedent`echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey}`
    );

    // Create filesystem on virtual partition.
    if (!driveIsFormatted) {
      await execCommand(dedent`yes | sudo mkfs.ext4 -q /dev/mapper/${encryptionKey}`);
    }

    // Mount virtual partition.
    await execCommand(dedent`
      sudo mkdir -p ${mountPath};
      sudo mount /dev/mapper/${encryptionKey} ${mountPath};
      sudo chmod 755 -R ${mountPath}
    `);
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve(stdout ? stdout : stderr);
    });
  });
}
