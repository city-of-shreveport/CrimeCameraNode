/**
 * Module dependencies.
 */
const app = require('../app');
const debug = require('debug')('CrimeCameraNode:server');
const dedent = require('dedent-js');
const execCommand = require('../helperFunctions');
const fs = require('fs');
const got = require('got');
const http = require('http');
require('dotenv').config();

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '80');
app.set('port', port);

/**
 * Bootstrap and start app.
 */
bootstrapApp().then(() => {
  const socketApi = require('../socketApi');
  const io = socketApi.io;

  const server = http
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
  var driveIsEncrypted = await execCommand(`lsblk -o NAME,TYPE,SIZE,MODEL | grep ${encryptionKey}`);

  if (driveIsEncrypted.includes(encryptionKey)) {
    mountStorageDrive(devicePath, mountPath, encryptionKey);
  } else {
    var driveIsFormatted = await execCommand(`blkid ${devicePath} | grep crypto_LUKS`);

    if (!driveIsFormatted.includes('crypto_LUKS')) {
      console.log(`Formatting ${devicePath}...`);
      await execCommand(`echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat ${devicePath}`);
      await execCommand(`yes | sudo mkfs.ext4 -q /dev/mapper/${encryptionKey}`);
    }

    mountStorageDrive(devicePath, mountPath, encryptionKey);
  }
}

async function mountStorageDrive(devicePath, mountPath, encryptionKey) {
  console.log(`Mounting ${devicePath} to ${mountPath}...`);
  await execCommand(dedent`
    sudo mkdir -p ${mountPath};
    echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
    sudo mount /dev/mapper/${encryptionKey} ${mountPath};
    sudo chmod 755 -R ${mountPath}
  `);
}
