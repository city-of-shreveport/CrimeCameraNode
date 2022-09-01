const utils=require('../../serviceUtils')('setupStorage');
const debug=utils.debug;
const execCommand=utils.execCommand;

const fs = require('fs')

/*
  STATUS REPORTING
  healthy   -- both drives are functioning correctly. System may still be misconfigured (i.e. wrong keys), but the drives are healthy and the system should be functional.
  degraded  -- one drive is missing, and the remaining drive is doing double duty. The system should be stable but it needs attention sooner than later.
  critical  -- one drive is missing, and the other could not be used for both purposes at once. One of the video streams is being written to the SD card. System needs attention now.
  emergency -- both drives are missing, and both streams are being written to the SD card. System needs attention yesterday.
*/


// each time a drive fails to mount, add 2
// each time it succeeds, subtract 1 (min 1)
// at 10, assume the drive is toast and stop trying.
// basically: 5 sequential failures in a row will count
// but if the drive is intermittent, if it's offline 50/50 or more,
// it'll get caught too. But if it is on more than 50/50, we'll keep trying it
var fail_count={
  video:0, // current count
  video_hwm:0, // high water mark
  buddy:0,
  buddy_hwm:0

}
function driveFailed(key) {
  fail_count[key]+=2;
  if(fail_count[key]>fail_count[key+'_hwm'])
    fail_count[key+'_hwm']=fail_count[key];
}
function driveSucceeded(key) {
  fail_count[key]--;
  if(fail_count[key]<0)
    fail_count[key]=0;
}
function didDriveFail(key) {
  return fail_count[key]>=10;
}


async function run() {
  utils.readConfig() // ensure we have fresh config every run

  try {
    return await runInternal(true);
  }
  catch(err) {}

  debug("Unable to properly detect state. Attempting to unmount everything and try again.");
  if(!didDriveFail('video')) {
    try { await execCommand("sudo umount "+utils.paths.video_dir); } catch(e){}
    try { await execCommand("sudo cryptsetup --batch-mode -d - luksClose /dev/mapper/"+utils.config.videoDriveEncryptionKey); } catch(e){}
  }
  if(!didDriveFail('buddy')) {
    try { await execCommand("sudo umount "+utils.paths.buddy_dir); } catch(e){}
    try { await execCommand("sudo cryptsetup --batch-mode -d - luksClose /dev/mapper/"+utils.config.buddyDriveEncryptionKey); } catch(e){}
  }

  return await runInternal();
}


const prepDrive = async(driveSpec,driveName,mountPath,encryptionKey) => {
  debug(`  Setting up ${driveName.toLowerCase()} drive (${driveSpec.devicePath})...`)
  try {
    await bringDriveFullyOnline(driveSpec,mountPath,encryptionKey);

    driveSpec.ioWorked=await iotest(mountPath);
    if(driveSpec.ioWorked) {
      debug(`    ${driveName} drive online`);
      return true;
    }
    else {
      debug(`    ${driveName} failed I/O test`);
      return false;
    }
  }
  catch(e) {
    debug(e);
    return false;
  }
}
async function runInternal(firstTry) {
  debug("Setting up video and buddy drives")

  var drives=await getDriveState();
  // if this throws it is because something like mount or lsblk threw
  // there is basically no path forward in that case anyway so may as well let it crash

  if(!drives.video && !drives.buddy && drives.unknown) {
    // we have a single unknown/unformatted/unencrypted drive.
    // exec decision: just call it the video drive and sort it out later since the system is in a bad state
    drives.video=drives.unknown;
    delete drives.unknown;
  }
  if(didDriveFail('video'))
    drives.video=null;
  if(didDriveFail('buddy'))
    drives.buddy=null;

  var heartbeatData={status:"healthy",date:Date.now(),video:drives.video,buddy:drives.buddy,fails:fail_count};

  // we have identified every drive attached (which could be 0, 1, or 2)
  // this will format if necessary
  if(drives.video) {
    var ok=await prepDrive(drives.video,'Video',utils.paths.video_dir,utils.config.videoDriveEncryptionKey);
    if(!ok && drives.video.luksFormatted && !drives.video.luksOpened) {

      // we saw a rare failure case where drives had the wrong encryption key used. So try the other just in case
      ok=await prepDrive(drives.video,'Video',utils.paths.video_dir,utils.config.buddyDriveEncryptionKey);
      if(ok)debug("    Warning: Had to use buddy drive encryption key");
    }
    if(!ok) {
      debug("    Video drive failed to come online");
      driveFailed('video');
      drives.video=null;
    }
    else {
      driveSucceeded('video');
    }
  }
  if(drives.buddy) {
    var ok=await prepDrive(drives.buddy,'Buddy',utils.paths.buddy_dir,utils.config.buddyDriveEncryptionKey);
    if(!ok && drives.buddy.luksFormatted && !drives.buddy.luksOpened) {
      // we saw a rare failure case where drives had the wrong encryption key used. So try the other just in case
      ok=await prepDrive(drives.buddy,'Buddy',utils.paths.buddy_dir,utils.config.videoDriveEncryptionKey);
      if(ok)debug("    Warning: Had to use video drive encryption key");
    }
    if(!ok) {
      debug("    Buddy drive failed to come online");
      driveFailed('buddy')
      drives.buddy=null;
    }
    else {
      driveSucceeded('buddy');
    }
  }

  if(!drives.video && !drives.buddy) {
    if(firstTry) {
      throw new Error("Inconsistent");
    }
    // no drives are working
    // ensure the files exist for writing to the sd card
    try {
      await execCommand(`sudo mkdir -p ${utils.paths.video_dir}`);
      await execCommand(`sudo mkdir -p ${utils.paths.buddy_dir}`);
    }catch(e){}
    heartbeatData.status="emergency";
    debug("Working in emergency mode; using system drive for video and buddy systems");
  }
  else if(drives.video && drives.buddy) {
    debug("Both drives mounted successfully");
  }
  else if(drives.video && !drives.buddy) {
    try {
      await bindAlternateStorageDrive(utils.paths.video_dir,utils.paths.buddy_dir);
      debug("Working in degraded mode; using video drive for video and buddy systems");
      heartbeatData.status="degraded";
    } catch(err) {
      debug("Failed to bind video drive to buddy drive");
      heartbeatData.status="critical";
    }
  }
  else if(drives.buddy && !drives.video) {
    try {
      bindAlternateStorageDrive(utils.paths.buddy_dir,utils.paths.video_dir);
      debug("Working in degraded mode; using buddy drive for video and buddy systems");
      heartbeatData.status="degraded";
    } catch(err) {
      debug("Failed to bind buddy drive to video drive");
      heartbeatData.status="critical";
    }
  }

  if(!heartbeatData.video) {
    heartbeatData.video={exists:false}; // null fields are sometimes weird in mongo, so ensure minimal data for each drive
  }
  if(!heartbeatData.buddy) {
    heartbeatData.buddy={exists:false};
  }
  utils.writeHeartbeatData(heartbeatData);
  debug("Completed setting up drives");
}

module.exports = {
  run
}


async function iotest(base) {
  try {
    debug(`    Testing file I/O on ${base}`);
    await fs.promises.writeFile(`${base}/io_test`,"test");
    await fs.promises.unlink(`${base}/io_test`);
    return true;
  }
  catch(e) {
    debug(e);debug(e);
    return false;
  }
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
const getDriveState = async() => {
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
  var tmp=devices.find(d=>d.luksOpened && d.luksName==utils.config.videoDriveEncryptionKey)
  if(tmp)video=tmp;
  tmp=devices.find(d=>d.luksOpened && d.luksName==utils.config.buddyDriveEncryptionKey)
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
    // if a drive has failed, don't try it's enc key.
    if(!didDriveFail('video')) {
      try {
        // try video drive
        await luksOpenDrive(drive,utils.config.videoDriveEncryptionKey);
        return {video:drive,buddy:null}
      }catch(err) {
         // wrong key, that's ok
      }
    }
    if(!didDriveFail('buddy')) {
      try {
        // try buddy drive
        await luksOpenDrive(drive,utils.config.buddyDriveEncryptionKey);
        return {video:null,buddy:drive}
      }catch(err) {
         // wrong key, that's ok
      }
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
