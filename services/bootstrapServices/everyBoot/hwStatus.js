const utils=require('../../serviceUtils')('hwStatus');

const fs = require('fs')

async function run() {
  utils.readConfig() // for sanitize
  var data=await getData()
  utils.writeHeartbeatData(data);
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
    usb:await getLSUSBData()
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
    var d=await utils.execCommand(`vcgencmd measure_temp`);
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
    var d=await utils.execCommand(`vcgencmd get_throttled`);
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
    var d=await utils.execCommand(`vcgencmd measure_clock ${clock}`);
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
    var d=await utils.execCommand(`vcgencmd measure_volts ${block}`);
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
    var d=await utils.execCommand(`uptime`)
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
    var d=await utils.execCommand(`df --output=target,size,used,avail --block-size=K`);
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
      video:d.find(o=>o.path==utils.paths.video_dir)||"not found",
      buddy:d.find(o=>o.path==utils.paths.buddy_dir)||"not found",
      ramdisk:d.find(o=>o.path==utils.paths.ram_disk)||"not found"
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
    var d=await utils.execCommand(`free -wk`);
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




function cleanLSUSB(dat) {
  var ret={}
  dat.line=dat.line.replace(/\/:|\|__/g,'').trim()
  if(dat.line.startsWith('Port')) {
    var l=dat.line.match(/Port ([0-9]+): Dev ([0-9]+), If ([0-9]+), Class=(.*?), Driver=(.*?), (.*)/);
    ret.port=+l[1];
    ret.dev=+l[2];
//    ret.if=+l[3];
    ret.class=l[4]
//    ret.driver=l[5]
    ret.speed=l[6]
  }
  else if(dat.line.startsWith('Bus')) {
    var l=dat.line.match(/Bus ([0-9]+)\.Port ([0-9]+): Dev ([0-9]+), Class=(.*?), Driver=(.*?), (.*)/);
    ret.bus=l[1]
    ret.port=+l[2];
    ret.dev=+l[2];
    ret.class=l[4]
//    ret.driver=l[5]
    ret.speed=l[6]
  }
  else {
    ret.type="unknown"
    ret.raw=dat.line
  }
  if(ret.speed=='12M')ret.speed="1/12Mbps"
  else if(ret.speed=='480M')ret.speed="2/480Mbps"
  else if(ret.speed=='5000M')ret.speed="3/5Gbps"
  else if(ret.speed=='10000M')ret.speed="3.1/10Gbps"
  else if(ret.speed=='20000M')ret.speed="3.2/20Gbps"
  else if(ret.speed=='40000M')ret.speed="4/40Gbps"
  if(dat.children.length)
    ret.children=dat.children.map(cleanLSUSB);
  return ret;
}

async function getLSUSBData() {
  var str=await utils.execCommand(`lsusb -t`);
  str=str.stdout.split('\n').filter(l=>l);
  str=str.map(o=>({line:o.trim(),depth:o.match(/^(\s*)/)[1].length/4,children:[]}))
  var root=[];
  var work=[];
  for(var i=0;i<str.length;++i) {
    if(str[i].depth==0)continue;
    for(var j=i-1;j>=0;j--) {
      if(str[j].depth < str[i].depth) {
        str[j].children.push(str[i])
        break
      }
    }
  }
  return str.filter(o=>o.depth==0).map(cleanLSUSB)
}


module.exports = {
  run
}
