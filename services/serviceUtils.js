const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs=require('fs');

const debug_raw = require('debug')

const RAM_DISK_BASE="/mnt/ramdisk";
const VIDEO_DIR="/home/pi/videos";
const BUDDY_DIR="/home/pi/remote_backups";


module.exports=function(module_name) {
  const debug=debug_raw(module_name);
  debug.enabled = true

  var ob={
    paths:Object.freeze({
      ram_disk:RAM_DISK_BASE,
      video_dir:VIDEO_DIR,
      buddy_dir:BUDDY_DIR
    }),

    debug,
    enableDebug() {
      debug.enabled=true;
    },
    disableDebug() {
      debug.enabled=false;
    },

    readConfig(){
      debug("Reading config...");
      var configString = fs.readFileSync(`${RAM_DISK_BASE}/config.json`, 'utf8');
      ob.config=JSON.parse(configString).config;
      return ob.config
    },

    sanitize(str) {
      if(!ob.config)ob.readConfig();
      str=str.replace(new RegExp(ob.config.videoDriveEncryptionKey,"g"),"<video key>")
      str=str.replace(new RegExp(ob.config.buddyDriveEncryptionKey,"g"),"<buddy key>")
      return str;
    },

    execCommand(command){
      try {
        return exec(command)
      } catch(e) {
        debug("COMMAND FAILED")
        var cmd=command;
        var str=e.stack||e.message||e;
        var err=e.stderr;
        debug(ob.sanitize(cmd));
        debug(ob.sanitize(str));
        debug(ob.sanitize(err));
        throw e;
      }
    },

    writeHeartbeatData(data){
      fs.writeFileSync(`${utils.paths.ram_disk}/services/${module_name}.json`, utils.sanitize(JSON.stringify(data)),'utf8');
    }

  }

  return ob;
}
