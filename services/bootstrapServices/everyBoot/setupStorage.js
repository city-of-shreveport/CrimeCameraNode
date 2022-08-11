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
  } else {
    try {
      var {stdout, stderr} = await execCommand(`sudo blkid ${devicePath} | grep crypto_LUKS`);
    } catch(err) {}

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
  `);
  // execCommand will throw only if the last command it executes fails
  // split this into 2 execCommands to ensure we throw if the mount fails
  // could also chain commands with && instead of ;
  var {stdout, stderr} = await execCommand(dedent`
    sudo chown -R pi:pi ${mountPath};
    sudo chmod 755 -R ${mountPath};
  `);
};

const bindAlternateStorageDrive = async (fromPath,toPath) => {
  debug(`Attempting to bind ${fromPath} to ${toPath}`);

  var {stdout, stderr} = await execCommand(dedent`
    sudo mount --bind ${fromPath} ${toPath};
  `);
  // same as above, fail if this fails
  // we don't need -R here because the chown/chmod will have already happened for the files when the drive mounted successfully
  // so we just need to make sure the mount point has the right owner and perms.
  var {stdout, stderr} = await execCommand(dedent`
    sudo chown pi:pi ${toPath};
    sudo chmod 755 ${toPath};
  `);
}

const patchConfigDrives = (config,videoName,buddyName) => {
  if(videoName) {
    config.videoDriveDevicePath = "/dev/" + videoName;
  }
  else {
    config.videoDriveDevicePath = null;
  }
  config.videoDriveMountPath = "/home/pi/videos";

  if(buddyName) {
    config.buddyDriveDevicePath = "/dev/" + buddyName;
  }
  else {
    config.buddyDriveDevicePath = null;
  }
  config.buddyDriveMountPath = "/home/pi/remote_backups";
}

const guessConfig = async (devicePath, mountPath, encryptionKey) => {
  try {
    await setupStorageDrive(devicePath, mountPath, encryptionKey);
    return true;
  } catch(err) {
    return false
  }
};

const patchConfig = async (config) => {
  // we can't trust the config to know which drive is which, so read the data back live
  var {stdout, stderr} = await execCommand(`lsblk --json -b -o NAME,SIZE`);

  if(stdout) {
    var json=JSON.parse(stdout);
    /* structure is like
      {
        "blockdevices": [
          {
            "name": "sda",
            "size": 1234,
            "children": [
              {
                "name": "sda1",
                "size": 1234,
                "children": [
                  {
                    "name": "enc_key",
                    "size": 1234
                  }
                ]
              }
            ]
           }
         ]
       }
    */

    // keep the >1TB drives, sort smallest drive first
    var largeDrives = json.blockdevices.filter( d => d.size > 1e12 ).sort( (a,b) => a.size - b.size );

    if(largeDrives.length>=2) {
      // we've got at least 2 large drives. Assume smallest is for our videos, next smallest is for backups
      // this assumption might be wrong for systems with 3+ large drives, which isn't an issue. yet.
      return patchConfigDrives(config,largeDrives[0].children[0].name,largeDrives[1].children[0].name);
    }
    else if(largeDrives.length==1) {
      // only 1 large drive is active. we are working in degraded mode.
      // if the system has already been booted and this is a service restart, we can tell which drive is which by name.
      // but if this is a cold boot (more likely), we just have to try both keys and see what works

      // optimistic case: already booted
      if(largeDrives[0].children && largeDrives[0].children.length
           && largeDrives[0].children[0].children && largeDrives[0].children[0].children.length) {
        // we got lucky and can use existing config
        if(largeDrives[0].children[0].children[0].name == config.videoDriveEncryptionKey) {
          // we just have the video drive
          return patchConfigDrives(config,largeDrives[0].children[0].name,null);
        }
        else if(largeDrives[0].children[0].children[0].name == config.buddyDriveEncryptionKey) {
          // we just have the buddy drive
          return patchConfigDrives(config,null,largeDrives[0].children[0].name);
        }
        else {
          // neither drive; should not happen
          return patchConfigDrives(config,null,null);
        }
      }
      else {
        // cold boot, have to guess and check. This will mount whichever drive we happen to have
        // guess that it is the primary
        if(await guessConfig("/dev/"+largeDrives[0].children[0].name, "/home/pi/videos", config.videoDriveEncryptionKey)) {
          config._videoMounted=true;
          return patchConfigDrives(config,largeDrives[0].children[0].name,null);
        }
        else if(await guessConfig("/dev/"+largeDrives[0].children[0].name, "/home/pi/remote_backups", config.buddyDriveEncryptionKey)) {
          config._buddyMounted=true;
          return patchConfigDrives(config,null,largeDrives[0].children[0].name);
        }
        else {
          // neither drive; should not happen
          return patchConfigDrives(config,null,null);
        }
      }
    }
  }
}

async function run() {
  debug("Reading config...");
  configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');
  config = JSON.parse(configString).config;

  await patchConfig(config); // this might mount *one* drive, if we are a cold boot in degraded mode

  debug("Setting up video and buddy drives")

  if(!config._videoMounted) {
    try {
      await setupStorageDrive(config.videoDriveDevicePath, config.videoDriveMountPath, config.videoDriveEncryptionKey);
      config._videoMounted=true;
      debug("Video drive mounted successfully");
    } catch(err) {
      debug("Video drive failed to mount");
    }
  }
  if(!config._buddyMounted) {
    try {
      await setupStorageDrive(config.buddyDriveDevicePath, config.buddyDriveMountPath, config.buddyDriveEncryptionKey);
      config._buddyMounted=true;
      debug("Buddy drive mounted successfully");
    } catch(err) {
      debug("Buddy drive failed to mount");
    }
  }

  var bindFailed=false;
  if(config._videoMounted && !config._buddyMounted) {
    try {
      bindAlternateStorageDrive(config.videoDriveMountPath,config.buddyDriveMountPath);
      debug("Working in degraded mode; using video drive for video and buddy systems");
    } catch(err) {
      debug("Failed to bind video drive to buddy drive");
      bindFailed=true;
    }
  }
  if(config._buddyMounted && !config._videoMounted) {
    try {
      bindAlternateStorageDrive(config.buddyDriveMountPath,config.videoDriveMountPath);
      debug("Working in degraded mode; using buddy drive for video and buddy systems");
    } catch(err) {
      debug("Failed to bind buddy drive to video drive");
      bindFailed=true;
    }
  }
  if(bindFailed || (!config._videoMounted && !config._buddyMounted)) {
    debug("Working in emergency mode; using system drive for video and buddy systems");
    // since the mount path was created, files should automatically go to system drive.
  }

  debug("Completed setting up drives");
}

module.exports = {
  run
}
