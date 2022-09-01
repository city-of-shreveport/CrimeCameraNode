const {debug,execCommand,...utils}=require('../../serviceUtils')('swStatus');

const fs = require('fs')
const pm2 = require('pm2')

async function run() {
  utils.readConfig() // for sanitize
  var data=await getData()
  utils.writeHeartbeatData(data);
}

// this system will report emergency if any of the pm2 modules are not online
async function getData() {
  var dat={
    status:"healthy",
    date:Date.now(),
    pm2:await getPM2Data(),
    git:await getGitData()
  }

  for(var i=0;i<dat.pm2.length;i++) {
    if(dat.pm2[i].status!='online')
      dat.status='emergency'
  }
  return dat;
}

function processPM2Data(dat) {
  return {
    name:dat.name,
    status:dat.pm2_env.status,
    id:dat.pm_id,
    pid:dat.pid,
    restarts:dat.pm2_env.unstable_restarts,
    uptimeHours:parseFloat(((Date.now()-dat.pm2_env.pm_uptime)/3600/1000).toFixed(2)),
    memoryMB:dat.monit.memory/1024/1024,
    cpu:dat.monit.cpu
  }
}
async function getPM2Data() {
  try {
    var dat=await new Promise((resolve,reject)=>{
      pm2.list((err,dat)=>{
        if(err)reject(err);
        resolve(dat);
      });
    });
    dat=dat.map(processPM2Data)
    dat.sort((a,b)=>a.id-b.id);
    return dat;
  }
  catch(e) {
    return e.message;
  }
  finally {
    pm2.disconnect();
  }
}


async function getGitData() {
  try {
    var d=await execCommand(`git status --porcelain -b`)
    d=d.stdout.trim().split('\n')
    var branch_line=d.shift();
    var branch=branch_line.match(/^## (.*?)\.\.\./);
    var ahead=branch_line.match(/ahead ([0-9]+)/);
    var behind=branch_line.match(/behind ([0-9]+)/);
    return {
      branch:branch?branch[1]:'<unknown>',
      ahead:ahead?parseInt(ahead[1]):0,
      behind:behind?parseInt(behind[1]):0,
      dirtyFiles:d.length
    }
  }
  catch(e) {
    return e.message;
  }
}

module.exports = {
  run
}
