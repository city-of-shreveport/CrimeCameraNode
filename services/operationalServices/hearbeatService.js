require('dotenv').config();
const axios = require('axios').default;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const debug = require('debug')('heartbeatService')
debug.enabled = true
const fs = require('fs')

const dedent = require('dedent-js');

var config = {}

async function run() {
  while(true) {
    debug("Collecting heartbeat checks.");

    var data = { 
      node: `${process.env.NODE_IDENTIFIER}`,
      health: {
        ramdiskHealthy: await ramdiskHealthy(),
        configHealthy: await configHealthy(),
        //TODO:
        //firewallHealthy: await firewallHealthy(),
        drivesHealthy: await drivesHealthy(),
        videosAreRecording: await videosAreRecording()
      }
    }

    debug("Completed. Data:");
    debug(data);

    await axios.post(`${process.env.NODE_SERVER}/api/heartbeats`, data)
    await axios.post(`${process.env.NODE_SERVER}/api/nodes/checkin/${process.env.NODE_IDENTIFIER}`, data)

    debug("Heartbeat Completed. Sleeping 60 seconds...");
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}

async function ramdiskHealthy() {
  mounted = true

  try {
    var {stdout, stderr} = await exec(`mount | grep 'tmpfs on /mnt/ramdisk'`);
  } catch(error) {
    mounted = false
  }

  debug(`Ramdisk Healthy? ${mounted}`);
  return mounted;
}

async function configHealthy() {
  configWorks = true

  try {
    configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');

    config = JSON.parse(configString).config;
  } catch(error) {
    configWorks = false
  }

  debug(`Config Healthy? ${configWorks}`);
  return configWorks;
}

async function firewallHealthy() {
  return true;
}

async function drivesHealthy() {
  var videoMountWorking = false;

  var {stdout, stderr} = await exec(`sudo lsblk -o NAME,TYPE,SIZE,MODEL | grep ${config.videoDriveEncryptionKey}`);

  if (stdout.includes(config.videoDriveEncryptionKey)) {
    videoMountWorking = true; 
  }

  var buddyMountWorking = false;

  var {stdout, stderr} = await exec(`sudo lsblk -o NAME,TYPE,SIZE,MODEL | grep ${config.buddyDriveEncryptionKey}`);

  if (stdout.includes(config.buddyDriveEncryptionKey)) {
    buddyMountWorking = true; 
  }

  var result = videoMountWorking && buddyMountWorking;

  debug(`Drives Healthy? ${result}`);

  return result;
}

async function videosAreRecording() {
  var camerasRecording = [false, false, false];

  for(i = 1; i < 4; i++) {
    var {stdout, stderr} = await exec(`ls -t /home/pi/videos/camera${i} | head -n 1`);

    const file_fd = fs.openSync(`/home/pi/videos/camera${i}/${stdout.replace("\n", "")}`, 'r');

    var stats = fs.fstatSync(file_fd);

    var mtime = stats.mtime;

    var testDate = (Date.now() - 15 * 60000)

    if(mtime > testDate) {
      camerasRecording[i - 1] = true    
    } else {
      camerasRecording[i - 1] = false
    }
  }

  var result = camerasRecording[0] && camerasRecording[1] && camerasRecording[2];

  debug(`Cameras Recording? ${result}`);
  
  return result;
}

run()
