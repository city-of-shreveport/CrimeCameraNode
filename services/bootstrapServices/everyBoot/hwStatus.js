const util = require('util');
const exec = util.promisify(require('child_process').exec);

const debug = require('debug')('hwStatus')
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

const RAM_DISK_BASE="/mnt/ramdisk";

async function run() {
  debug("Reading config...");
  var  configString = fs.readFileSync(`${RAM_DISK_BASE}/config.json`, 'utf8');
  config = JSON.parse(configString).config;

  var data=await getData()
  writeHeartbeatData(data);
}

const writeHeartbeatData = (data) => {
  fs.writeFileSync(`${RAM_DISK_BASE}/services/hwStatus.json`, sanitize(JSON.stringify(data)),'utf8');
}



// this system is for reporting only; for now it only can report healthy
async function getData() {
  return {
    status:"healthy",
    date:Date.now(),
    uptime:await getUptimeData(),
    disks:await getDFData(),
    ram:await getFreeData(),
    pi:await getVcgencmdData(),
  }
}

async function getVcgencmdData() {
  return {
    temepratureC:await vcgencmdMeasureTemp(),
    throttled:await vcgencmdGetThrottled(),
    clock:{
      cpu:await vcgencmdMeasureClock("arm"),
      sdCard:await vcgencmdMeasureClock("emmc")
    },
    volts:{
      core:await vcgencmdMeasureVolts("core"),
      sdram_c:await vcgencmdMeasureVolts("sdram_c"),
      sdram_i:await vcgencmdMeasureVolts("sdram_i"),
      sdram_p:await vcgencmdMeasureVolts("sdram_p")
    }
  }
}

async function vcgencmdMeasureTemp() {
  try {
    var d=await execCommand(`vcgencmd measure_temp`);
    d=d.stdout.trim().match(/^temp=([0-9]+\.[0-9]+)'C$/)
    if(!d)return "N/A";
    return parseFloat(d[1]);
  }
  catch(e) {
    return e.message
  }
}
async function vcgencmdGetThrottled() {
  try {
    var d=await execCommand(`vcgencmd get_throttled`);
    d=d.stdout.trim().match(/^throttled=(0x[0-9a-fA-F]+)$/)
    if(!d)return "N/A";
    var numeric=parseInt(d[1],16);
    return {
      raw:numeric,
      current:{
        underVoltage: !!(numeric&(1<<0)),
        armFreqCapped:!!(numeric&(1<<1)),
        throttled:    !!(numeric&(1<<2)),
        softTempLimit:!!(numeric&(1<<3))
      },
      occurred:{
        underVoltage: !!(numeric&(1<<16)),
        armFreqCapped:!!(numeric&(1<<17)),
        throttled:    !!(numeric&(1<<18)),
        softTempLimit:!!(numeric&(1<<19))
      }
    }

  }
  catch(e) {
    return e.message;
  }
}
async function vcgencmdMeasureClock(clock) {
  try {
    var d=await execCommand(`vcgencmd measure_clock ${clock}`);
    d=d.stdout.trim().match(/^frequency\(.*\)=([0-9]+)$/)
    if(!d)return "N/A";
    return parseInt(d[1]);
  }
  catch(e) {
    return e.message;
  }
}
async function vcgencmdMeasureVolts(block) {
  try {
    var d=await execCommand(`vcgencmd measure_volts ${block}`);
    d=d.stdout.trim().match(/^volt=([0-9]+\.[0-9]+)V$/)
    if(!d)return "N/A";
    return parseFloat(d[1]);
  }
  catch(e) {
    return e.message;
  }
}


async function getUptimeData() {
  try {
    var d=await execCommand(`uptime`)
    d=d.stdout.trim().match(/^.*? up (.*?),  ([0-9]) user,  load average: ([0-9]+\.[0-9]+), ([0-9]+\.[0-9]+), ([0-9]+\.[0-9]+)$/);
    if(!d)return "N/A"
    return {
      up:d[1],
      users:parseInt(d[2]),
      load:{
        "1min":parseFloat(d[3]),
        "5min":parseFloat(d[4]),
        "15min":parseFloat(d[5])
      }
    }
  }
  catch(e) {
    return e.message
  }
}

async function getDFData() {
  try {
    var d=await execCommand(`df --output=target,size,used,avail --block-size=K`);
    d=d.stdout.trim().split('\n');
    d.shift() // remove header
    d=d.map(l=>{
      l=l.split(/\s+/);
      var ret={
        path:l[0],
        size:parseInt(l[1]),
        used:parseInt(l[2]),
        avail:parseInt(l[3]),
      }
      ret.usedPercent=parseFloat((ret.used/ret.size*100).toFixed(3))
      return ret;
    });
    return {
      root:d.find(o=>o.path=='/')||"not found",
      boot:d.find(o=>o.path=='/boot')||"not found",
      video:d.find(o=>o.path=='/home/pi/videos')||"not found",
      buddy:d.find(o=>o.path=='/home/pi/remote_backups')||"not found",
      ramdisk:d.find(o=>o.path==RAM_DISK_BASE)||"not found",
    }
  }
  catch(e) {
    return e.message
  }
}

function processFreeData(header,dat) {
  var o={};
  for(var i=1;i<dat.length;++i) {
    var h=header[i-1];
    o[h]=parseInt(dat[i])
  }
  if(o.available && o.total) {
    o.usedPercent=parseFloat(((1-o.available/o.total)*100).toFixed(3))
  }
  else if(o.used && o.total) {
    o.usedPercent=parseFloat((o.used/o.total*100).toFixed(3))
  }
  return o;
}
async function getFreeData() {
  try {
    var d=await execCommand(`free -wk`);
    d=d.stdout.trim().split('\n');
    var header=d[0].split(/\s+/)
    var mem=d[1].split(/\s+/)
    var swap=d[2].split(/\s+/)
    return {
      memory:processFreeData(header,mem),
      swap:processFreeData(header,swap)
    }
  }
  catch(e) {
    return e.message
  }
}

module.exports = {
  run
}
