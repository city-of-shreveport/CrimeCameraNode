const util = require('util');
const exec = util.promisify(require('child_process').exec);

const debug = require('debug')('setupStorage')
debug.enabled = true
const fs = require('fs')

const dedent = require('dedent-js');

var config = {}

const execCommand = (command) => {
  return exec(command)
};

const setupStorageDrive = async (devicePath, mountPath, encryptionKey) => {
  var stdout = "";
  var stderr = "";

  try {
    var {stdout, stderr} = await execCommand(`sudo lsblk -o NAME,TYPE,SIZE,MODEL | grep ${encryptionKey}`);
  } catch(err) { }

  if (stdout.includes(encryptionKey)) {
    debug("Encrypted and Formatted Drive Exists.");
    debug("Mounting drive with Encryption Key");

    await mountStorageDrive(devicePath, mountPath, encryptionKey);
  } else {
    var {stdout, stderr} = await execCommand(`sudo blkid ${devicePath} | grep crypto_LUKS`);

    if (!stdout.includes('crypto_LUKS')) {
      debug(`Formatting ${devicePath}...`);

      await execCommand(dedent`
      sudo parted --script ${devicePath.slice(0, -1)} mklabel gpt
      sudo parted --script -a opt ${devicePath.slice(0, -1)} mkpart primary ext4 0% 100%
      yes | sudo mkfs -t ext4 ${devicePath}
    `);

      await execCommand(dedent`
      echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat ${devicePath};
      echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
      yes | sudo mkfs -t ext4 /dev/mapper/${encryptionKey};
    `);
    }
  }

  await mountStorageDrive(devicePath, mountPath, encryptionKey);
};

const mountStorageDrive = async (devicePath, mountPath, encryptionKey) => {
  debug(`Mounting ${devicePath} to ${mountPath}...`);

  var {stdout, stderr} = await execCommand(dedent`
    sudo mkdir -p ${mountPath};
    echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
    sudo mount /dev/mapper/${encryptionKey} ${mountPath};
    sudo chown -R pi:pi ${mountPath};
    sudo chmod 755 -R ${mountPath};
  `);
};

async function run() {
  debug("Reading config...");
  configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');
  config = JSON.parse(configString).config;

  debug("Setting up video and buddy drives")
  await setupStorageDrive(config.videoDriveDevicePath, config.videoDriveMountPath, config.videoDriveEncryptionKey);
  await setupStorageDrive(config.buddyDriveDevicePath, config.buddyDriveMountPath, config.buddyDriveEncryptionKey);
  debug("Completed setting up drives");
}

module.exports = {
  run
}
