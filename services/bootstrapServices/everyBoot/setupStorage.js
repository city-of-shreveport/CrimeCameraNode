const util = require('util');
const exec = util.promisify(require('child_process').exec);

const debug = require('debug')('setupStorage')
debug.enabled = true
const fs = require('fs')

var config = {}

function sanitize(str) {
  str=str.replace(new RegExp(config.videoDriveEncryptionKey,"g"),"<video key>")
  str=str.replace(new RegExp(config.buddyDriveEncryptionKey,"g"),"<buddy key>")
  return str;
}
const execCommand = (command) => {
  try {
    return exec(command)
  } catch(e) {
    debug("COMMAND FAILED")
    var cmd=command;
    var str=e.stack||e.message||e;
    var err=e.stderr;
    debug(sanitize(cmd));
    debug(sanitize(str));
    debug(sanitize(err));
    throw e;
  }
};

/*
  STATUS REPORTING
  healthy   -- both drives are functioning correctly. System may still be misconfigured (i.e. wrong keys), but the drives are healthy and the system should be functional.
  degraded  -- one drive is missing, and the remaining drive is doing double duty. The system should be stable but it needs attention sooner than later.
  critical  -- one drive is missing, and the other could not be used for both purposes at once. One of the video streams is being written to the SD card. System needs attention now.
  emergency -- both drives are missing, and both streams are being written to the SD card. System needs attention yesterday.
*/

const VIDEO_DIR="/home/pi/videos";
const BUDDY_DIR="/home/pi/remote_backups";
const RAM_DISK_BASE="/mnt/ramdisk";

async function run() {
  debug("Reading config...");
  configString = fs.readFileSync(`${RAM_DISK_BASE}/config.json`, 'utf8');
  config = JSON.parse(configString).config;

  try {
    return await runInternal(config,true);
  }
  catch(err) {}

  debug("Unable to properly detect state. Attempting to unmount everything and try again.");
  try { await execCommand("sudo umount "+VIDEO_DIR); } catch(e){}
  try { await execCommand("sudo umount "+BUDDY_DIR); } catch(e){}
  try { await execCommand("sudo cryptsetup --batch-mode -d - luksClose /dev/mapper/"+config.videoDriveEncryptionKey); } catch(e){}
  try { await execCommand("sudo cryptsetup --batch-mode -d - luksClose /dev/mapper/"+config.buddyDriveEncryptionKey); } catch(e){}

  return await runInternal(config);
}


const prepDrive = async(driveSpec,driveName,mountPath,encryptionKey) => {
  debug(`  Setting up ${driveName.toLowerCase()} drive (${driveSpec.devicePath})...`)
  try {
    await bringDriveFullyOnline(driveSpec,mountPath,encryptionKey);
    debug("    ${driveName} drive online");
    return true;
  }
  catch(e) {
    return false;
  }
}
async function runInternal(config,firstTry) {
  debug("Setting up video and buddy drives")

  var drives=await getDriveState(config);
  // if this throws it is because something like mount or lsblk threw
  // there is basically no path forward in that case anyway so may as well let it crash

  if(!drives.video && !drives.buddy && drives.unknown) {
    // we have a single unknown/unformatted/unencrypted drive.
    // exec decision: just call it the video drive and sort it out later since the system is in a bad state
    drives.video=drives.unknown;
    delete drives.unknown;
  }

  var heartbeatData={status:"healthy",date:Date.now(),video:drives.video,buddy:drives.buddy};

  // we have identified every drive attached (which could be 0, 1, or 2)
  // this will format if necessary
  if(drives.video) {
    var ok=prepDrive(drives.video,'Video',VIDEO_DIR,config.videoDriveEncryptionKey);
    if(!ok && drives.video.luksFormatted && !drives.video.luksOpened) {
      // we saw a rare failure case where drives had the wrong encryption key used. So try the other just in case
      ok=prepDrive(drives.video,'Video',VIDEO_DIR,config.buddyDriveEncryptionKey);
      if(ok)debug("    Warning: Had to use buddy drive encryption key");
    }
    if(!ok) {
      debug("    Video drive failed to come online");
      drives.video=null;
    }
  }
  if(drives.buddy) {
    var ok=prepDrive(drives.buddy,'Buddy',BUDDY_DIR,config.buddyDriveEncryptionKey);
    if(!ok && drives.buddy.luksFormatted && !drives.buddy.luksOpened) {
      // we saw a rare failure case where drives had the wrong encryption key used. So try the other just in case
      ok=prepDrive(drives.buddy,'Buddy',BUDDY_DIR,config.videoDriveEncryptionKey);
      if(ok)debug("    Warning: Had to use video drive encryption key");
    }
    if(!ok) {
      debug("    Buddy drive failed to come online");
      drives.buddy=null;
    }
  }

  if(!drives.video && !drives.buddy) {
    if(firstTry) {
      throw new Error("Inconsistent");
    }
    // no drives are working
    // ensure the files exist for writing to the sd card
    try {
      await execCommand(`sudo mkdir -p ${VIDEO_DIR}`);
      await execCommand(`sudo mkdir -p ${BUDDY_DIR}`);
    }catch(e){}
    heartbeatData.status="emergency";
    debug("Working in emergency mode; using system drive for video and buddy systems");
  }
  else if(drives.video && drives.buddy) {
    debug("Both drives mounted successfully");
  }
  else if(drives.video && !drives.buddy) {
    try {
      await bindAlternateStorageDrive(VIDEO_DIR,BUDDY_DIR);
      debug("Working in degraded mode; using video drive for video and buddy systems");
      heartbeatData.status="degraded";
    } catch(err) {
      debug("Failed to bind video drive to buddy drive");
      heartbeatData.status="critical";
    }
  }
  else if(drives.buddy && !drives.video) {
    try {
      bindAlternateStorageDrive(BUDDY_DIR,VIDEO_DIR);
      debug("Working in degraded mode; using buddy drive for video and buddy systems");
      heartbeatData.status="degraded";
    } catch(err) {
      debug("Failed to bind buddy drive to video drive");
      heartbeatData.status="critical";
    }
  }

  await writeHeartbeatData(heartbeatData,config);
  debug("Completed setting up drives");
}

module.exports = {
  run
}



//------------------------------------------------------------------------------
// Check drive state

// This attempts to determine what state all drives are in.
// In a cold-boot scenario with a single drive working, it may fail to identify the drive
// If the drive has already been encrypted, it will luksOpen it to figure out which it is
// but this will not do anything lossy like partitioning or luksFormat.
// other code needs to handle that
// returns {video:state,buddy:state}, where either state might be null.
// If both are null, might additionally include unknown:state, which is an unknown drive
const getDriveState = async(config) => {
  // we need the output of 3 commands to identify state.

  // first, lsblk gets us most of the info we need
  var devices=await _lsblk();

  // second, we need blkid to detect if they have been formatted or not
  var blkid_lines=await _blkid();

  // third, we need mount output
  var mount_lines=await _mount();

  devices=devices.map(dev=>getSingleDriveState(dev,blkid_lines,mount_lines));

  if(devices.length != 2) {
    debug(`Warning: ${devices.length} large drives detected; expected 2`);
  }

  var video=null;
  var buddy=null;

  // if any have been luksOpened, use the enc key to determine which it is
  var tmp=devices.find(d=>d.luksOpened && d.luksName==config.videoDriveEncryptionKey)
  if(tmp)video=tmp;
  tmp=devices.find(d=>d.luksOpened && d.luksName==config.buddyDriveEncryptionKey)
  if(tmp)buddy=tmp;

  if(video && buddy)return {video,buddy}; // warm boot scenario

  // at least 1 drive wasn't recognized, so try to figure out which is which
  else if(video && !buddy) {
    buddy=devices.find(d=>d!=video); // this might be null, if only 1 drive, which is fine
    return {video,buddy}
  }
  else if(buddy && !video) {
    video=devices.find(d=>d!=buddy); // ditto
    return {video,buddy}
  }
  else {
    // we couldn't identify any drive (cold boot scenario), fall back to heuristics
    if(devices.length==0) {
      // emergency mode
      return {video:null,buddy:null};
    }
    if(devices.length>=2) {
      devices.sort((a,b)=>a.deviceSize-b.deviceSize);
      // assume the smallest > 1TB drive is video, the next smallest is buddy
      // this MIGHT PICK WRONG if there are more than 2 drives!
      return {video:devices[0],buddy:devices[1]};
    }

    // 1 drive, and it is not luksOpened (and may be even earlier in the chain).
    // attempt to luksOpen it with both keys to figure out which it is
    var drive=devices[0];
    if(!drive.luksFormatted) {
      // the drive needs to be partitioned and formatted, but that is a lossy operation.
      // let other code handle that
      return {video:null,buddy:null,unknown:drive};
    }

    // we can only get to here if the drive was formatted but not opened.
    // so guess and check, try to open it both ways.
    debug('  Attempting to guess which drive this is...');
    try {
      // try video drive
      await luksOpenDrive(drive,config.videoDriveEncryptionKey);
      return {video:drive,buddy:null}
    }catch(err) {
       // wrong key, that's ok
    }
    try {
      // try buddy drive
      await luksOpenDrive(drive,config.buddyDriveEncryptionKey);
      return {video:null,buddy:drive}
    }catch(err) {
       // wrong key, that's ok
    }
    // neither key worked
    return {video:null,buddy:null,unknown:drive};
  }

  return {video:null,buddy:null};
};

const getSingleDriveState = (drive,blkid,mount) => {
  // booleans are a chain, once you hit a false, everything after it is false
  // string values are known only if all bools above are true.
  var ret={
    exists:true,
    deviceName:drive.name,         // sda
    devicePath:'/dev/'+drive.name, // /dev/sda
    deviceSize:drive.size,
    partitioned:false,
    partitionName:'',              // sda1
    partitionPath:'',              // /dev/sda1
    luksFormatted:false,
    luksOpened:false,
    luksName:'',                   // enc-key
    luksPath:'',                   // /dev/mapper/enc-key
    mounted:false,
    mountPaths:[]                  // [/home/pi/whatever]
  };

  if(drive.children && drive.children.length) {
    ret.partitioned=true;
    ret.partitionName=drive.children[0].name;
    ret.partitionPath="/dev/"+ret.partitionName

    if(drive.children[0].children && drive.children[0].children.length) {
      // if the drive is already showing up, a lot of work has been done
      ret.luksFormatted=true;
      ret.luksOpened=true;
      ret.luksName=drive.children[0].children[0].name;
      ret.luksPath="/dev/mapper/"+ret.luksName

      var d=mount.filter(l=>l.device==ret.luksPath);
      if(d.length) {
        ret.mounted=true;
        ret.mountPaths.push(...d.map(l=>l.path))
        ret.mountPaths=[...new Set(ret.mountPaths)] // uniq
        if(d.some(l=>/\bro\b/.test(l.flags))) {
            debug('  WARNING: Drive mounted read-only!');
        }
      }
    }
    else {
      var b=blkid.find(l=>l.device==ret.partitionPath);
      if(b && b.data.includes('crypto_LUKS')) {
        ret.luksFormatted=true;
      }
    }
  }
  return ret;
};


//------------------------------------------------------------------------------
// Drive initialization steps / path

const bringDriveFullyOnline=async(drive,mountPath,encryptionKey) => {
  if(!drive.partitioned) {
    try {
      await partitionDrive(drive);
    } catch(e) {
      debug("    Failed to partition "+drive.devicePath);
      throw e;
    }
  }
  if(!drive.luksFormatted) {
    try {
      await luksFormatDrive(drive,encryptionKey);
    } catch(e) {
      debug("    Failed to luksFormat "+drive.devicePath);
      throw e;
    }
  }
  if(!drive.luksOpened) {
    try {
      await luksOpenDrive(drive,encryptionKey);
    } catch(e) {
      debug("    Failed to luksOpen "+drive.devicePath);
      throw e;
    }
  }
  if(!drive.mounted) {
    try {
      await mountDrive(drive,mountPath,encryptionKey);
    } catch(e) {
      debug("    Failed to mount "+drive.devicePath);
      throw e;
    }
  }

  if(drive.mounted && drive.mountPaths.length && !drive.mountPaths.includes(mountPath)) {
     try {
      await bindAlternateStorageDrive(drive.mountPaths[0],mountPath)
    } catch(e) {
      debug("    Failed to bind "+drive.devicePath);
      throw e;
    }

  }
}

const partitionDrive = async(deviceSpec) => {
  debug(`    Partitioning ${deviceSpec.devicePath}...`);

  var partitionName=deviceSpec.deviceName+"1";
  var partitionPath='/dev/'+partitionName

  await execCommand(`sudo parted --script ${deviceSpec.devicePath} mklabel gpt`);
  await execCommand(`sudo parted --script -a opt ${deviceSpec.devicePath} mkpart primary ext4 0% 100%`);
  await execCommand(`yes | sudo mkfs -t ext4 ${partitionPath}`);

  deviceSpec.partitioned=true;
  deviceSpec.partitionName=partitionName;
  deviceSpec.partitionPath=partitionPath;

};

const luksFormatDrive = async(deviceSpec,encryptionKey) => {
  debug(`    Formatting ${deviceSpec.partitionPath}...`);

  await execCommand(`echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat ${deviceSpec.partitionPath}`);
  await luksOpenDrive(deviceSpec,encryptionKey); // awkward, but have to open in the middle to make the fs
  await execCommand(`yes | sudo mkfs -t ext4 ${deviceSpec.luksPath}`);

  deviceSpec.luksFormatted=true;
}

const luksOpenDrive = async(deviceSpec,encryptionKey) => {
  debug(`    Opening ${deviceSpec.partitionPath}...`);

  try {
    await execCommand(`echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${deviceSpec.partitionPath} ${encryptionKey}`);
  } catch(err) {
    if(!err.stderr.includes(`Device ${encryptionKey} already exists.`))
      throw err;
  }

  deviceSpec.luksOpened=true;
  deviceSpec.luksName=encryptionKey;
  deviceSpec.luksPath="/dev/mapper/"+encryptionKey;
}

const mountDrive = async(deviceSpec, mountPath, encryptionKey) => {
  debug(`    Mounting ${deviceSpec.partitionPath}...`);

  await execCommand(`sudo mkdir -p ${mountPath}`);
  await execCommand(`sudo mount ${deviceSpec.luksPath} ${mountPath}`);
  await execCommand(`sudo chown -R pi:pi ${mountPath}`)
  await execCommand(`sudo chmod 755 -R ${mountPath}`)

  deviceSpec.mounted=true;
  deviceSpec.mountPaths.push(mountPath);
  deviceSpec.mountPaths=[...new Set(deviceSpec.mountPaths)] // uniq
};

const bindAlternateStorageDrive = async (fromPath,toPath) => {
  debug(`Attempting to bind ${fromPath} to ${toPath}`);

  var {stdout,stderr} = await execCommand('mount');
  if(stdout.includes(toPath)) {
    debug('  Drive already bound');
  }
  else {
    await execCommand(`sudo mkdir -p ${toPath}`);
    await execCommand(`sudo mount --bind ${fromPath} ${toPath}`);
  }
  // don't need -R here, since the drive would have already been set when opened at
  // its other path. Just make sure the mount path is ours
  await execCommand(`sudo chown pi:pi ${toPath}`);
  await execCommand(`sudo chmod 755 ${toPath}`);
}

//------------------------------------------------------------------------------
// Utilities

/* lsblk --json structure is like
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
const _lsblk = async () => {
  try {
    var {stdout,stderr} = await execCommand('lsblk --json -b -o NAME,SIZE');
  }catch(err) {
    debug('Critical error: lsblk failed')
    // there is absolutely nothing we can do if this fails
    throw err;
  }
  return JSON.parse(stdout).blockdevices.filter(d=>d.size > 1e12); // keep only the 1TB or larger drives;
}
const _blkid = async () => {
   try {
    var {stdout,stderr} = await execCommand('sudo blkid');
  }catch(err) {
    debug('Critical error: blkid failed')
    // there is absolutely nothing we can do if this fails
    throw err;
  }
  var blkid_lines=stdout.split('\n').map(l=>{
    var t=l.split(': ');
    return {device:t[0],data:t[1]}
  });
  return blkid_lines;
}

const _mount = async() => {
  try {
    var {stdout,stderr} = await execCommand('mount');
  }catch(err) {
    debug('Critical error: mount failed')
    // there is absolutely nothing we can do if this fails
    throw err;
  }
  var mount_lines=stdout.trim().split('\n').map(l=>{
    var t=l.match(/(.*) on (.*) type (.*) \((.*)\)/)
    if(!t)return null
    return {device:t[1],path:t[2],type:t[3],flags:t[4]}
  }).filter(l=>l);
  return mount_lines;
}


const writeHeartbeatData = async (data,config) => {
  if(!data.video) {
    data.video={exists:false}; // null fields are sometimes weird in mongo, so ensure minimal data for each drive
  }

  if(!data.buddy) {
    data.buddy={exists:false};
  }

  fs.writeFileSync(`${RAM_DISK_BASE}/services/setupStorage.json`, sanitize(JSON.stringify(data)),'utf8');
}
