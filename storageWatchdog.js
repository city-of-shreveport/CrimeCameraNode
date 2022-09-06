const util = require('util');
const fs=require('fs').promises;
const exec=util.promisify(require('child_process').exec);
const debug = require('debug')('storageWatchdog')
debug.enabled=true

const RESERVE_SPACE=5*1024*1024*1024; // 5 gigs

// a "device root" is all the files for a particular device
// for example: all 3 cameras of the local pi.
// or, all 3 cameras of a backed up pi.
// it is assumed that all files for a device exist on the same physical disk

// once all files are identified, they are grouped by disk
// (but not by root any more, that just is to simplify scanning)
// each disk is then checked for fullness. if the drive is near full,
// the oldest files are removed, without regard for whether they are vid or backup

async function constructDeviceRoots(path) {
  var cameras;
  try {
    cameras=await fs.readdir(path,{withFileTypes:true});
  }
  catch(e) {
    return null;
  }
  cameras=cameras.filter(f=>f.isDirectory());
  if(!cameras.length)return null;

  var roots=[]
  for(var cam of cameras)
    roots.push(await constructCameraRoot(`${path}/${cam.name}`))

  return roots.filter(o=>o);
}
async function constructCameraRoot(path) {
  // device identifies which hard drive. it doesn't really matter which
  // we just want to be able to group all files by drive later
  var device=(await fs.stat(path)).dev;

  var files=await scanCameraDirectory(path);
  if(!files)return null;
  files.sort((a,b)=>a.date-b.date) // sort oldest (smallest time) first
  var oldest=files[0].date;
  var newest=files[files.length-1].date;

  var size=(await exec(`du -sb ${path}`)).stdout.toString();
  size=+(size.split(/\s/)[0])// bytes

  var gigs=size/1024/1024/1024;
  var hours=(newest-oldest)/(3600*1000);

  var ret={
    root:path,
    device,
    size,
    oldest,
    newest,
    files,
    hoursOfFootage:hours,
    gigsPerHour:gigs/hours
  }

  debug('Camera Detected: '+JSON.stringify(ret,(k,v)=>{
    if(k=='files')return files.length; // don't log the *huge* files entry
    if(k=='newest' || k=='oldest')return new Date(v).toISOString(); // make human readable
    return v
  },2))

  return ret


}
async function scanCameraDirectory(path) {
  var files=await fs.readdir(path)
  if(!files.length) {
    try {
      await fs.rmdir(path);
      debug(`  Empty camera directory ${path} encountered; removing`)
    }
    catch(e) {}
    return null
  }
  var data={};
  files.forEach(f=>{
    var prefixNum=f.match(/^[0-9]+/)
    if(!data[prefixNum]) {
      data[prefixNum]={date:+prefixNum*1000,files:[]} // unix -> JS date
    }
    data[prefixNum].files.push(`${path}/${f}`);
  })
  return Object.values(data);
}


async function dfStats(path) {
  var dfstats=(await exec(`df --output=size,used,avail --block-size=1 ${path}`)).stdout.toString().trim()
    dfstats=dfstats.split('\n').pop()
    dfstats=dfstats.split(/\s/)
    return {
      size:+dfstats[0],
      used:+dfstats[1],
      avail:+dfstats[2],
    }
}
async function scanRoots() {
  var video=await constructDeviceRoots('/home/pi/videos/NVRJS_SYSTEM')

  var roots=[...video]
  try {
    var buddyDir=await fs.readdir('/home/pi/remote_backups/BACKUP',{withFileTypes:true})
    buddyDir=buddyDir.filter(f=>f.isDirectory())
    for(var d of buddyDir) {
      roots.push(...await constructDeviceRoots(`/home/pi/remote_backups/BACKUP/${d.name}`))
    }
  }catch(e) {
    // no buddy dir, that's fine
  }
  roots=roots.filter(r=>r && r.files.length) // remove any nulls or empty roots
  // summarize roots

  // merge roots by device
  var byDevice={}
  roots.forEach(r=>{
    if(!byDevice[r.device]){
      byDevice[r.device]={
        roots:[],
        device:r.device,
        size:0,
        oldest:1/0,
        newest:-1/0,
        files:[],
        gigsPerHour:0
      };
    }

    var d=byDevice[r.device];
    d.roots.push(r.root);
    d.files=d.files.concat(r.files)
    d.size+=r.size;
    if(r.newest > d.newest)d.newest=r.newest
    if(r.oldest < d.oldest)d.oldest=r.oldest
    d.gigsPerHour+=r.gigsPerHour
  })

  for(var i in byDevice) {
    byDevice[i].files.sort((a,b)=>a.date-b.date) // sort oldest (smallest time) first

    byDevice[i].hoursOfFootage=(byDevice[i].newest-byDevice[i].oldest)/(3600*1000)

    byDevice[i].driveStats=await dfStats(byDevice[i].roots[0])

    byDevice[i].approximateCapacityHours=((byDevice[i].driveStats.size-RESERVE_SPACE)/1024/1024/1024)/byDevice[i].gigsPerHour
  }

  return Object.values(byDevice)
}

async function removeFiles(f,dev) {
  var tot=0;
  for(var i=0;i<f.files.length;++i) {
    var fl=f.files[i];
    var stats=await fs.stat(fl);
    if(stats.dev!=dev)continue; // just in case something weird happened, don't delete files on other drives
    tot+=stats.blocks*512;
    var cam_path=fl.split('/').slice(-3).join('/')
    debug(`  Removing ${cam_path} - ${(stats.blocks/2/1024).toFixed(3)}MB`)
    await fs.unlink(fl);
  }
  return tot;
}
async function cleanupDevice(dev) {
  if(dev.driveStats.avail >= RESERVE_SPACE){
    return {removed:0,expected:0,actual:0};
  }
  var ct=0;
  var size=0;

  var origAvail=dev.driveStats.avail;

  var root_bases=dev.roots.map(r=>{
    r=r.split('/');
    r.pop(); // remove camera
    r.pop();
    return r.join('/')
  })
  root_bases=[...new Set(root_bases)].sort().join(' = ') // uniq

  // two layers of loop on this deletion.
  // inner layer tries to delete what it *thinks* will free enough space
  // outer layer does the slower check to make sure it *actually* did,
  // and re-runs inner loop if needed.
  // purely an optimization to avoid calling df after every file.
  // either way, it won't delete more than 100 sets at a time.
  debug(`Need to free ${((RESERVE_SPACE-dev.driveStats.avail)/1024/1024).toFixed(3)}MB on ${root_bases}`)
  do {
    var size_this_loop=0;
    while(dev.driveStats.avail < RESERVE_SPACE && ct < 100 && dev.files.length) {
      var oldest=dev.files.shift();
      var s=await removeFiles(oldest,dev.device)
      size+=s;
      size_this_loop+=s
      dev.driveStats.avail+=s;
      ++ct;
    }
    dev.driveStats=await dfStats(dev.roots[0]);
  } while(dev.driveStats.avail < RESERVE_SPACE && ct < 100 && dev.files.length && size_this_loop) // if we don't estimate a change, bail to avoid inf loop
  debug(`Freed ${((dev.driveStats.avail-origAvail)/1024/1024).toFixed(3)}MB on ${root_bases}`)

  return {
    removed:ct,
    expected:size,
    actual:dev.driveStats.avail-origAvail
  }
}


async function processRoots() {
  var roots=await scanRoots();

  logRoots=[]
  for(var f of roots) {
    var tmp={...f} // shallow clone
    tmp.files=tmp.files.length
    logRoots.push(tmp);
  }

  for(var i=0;i<roots.length;++i) {
    logRoots[i].cleanup=await cleanupDevice(roots[i])
  }

  var heartbeat={status:"healthy",date:Date.now(),roots:logRoots}

  await fs.writeFile(`/mnt/ramdisk/services/storageWatchdog.json`, JSON.stringify(heartbeat),'utf8');
}


async function main() {
  while(true) {
    await processRoots();
    await new Promise(resolve => setTimeout(resolve, 600000));
  }
}

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
})

main()
