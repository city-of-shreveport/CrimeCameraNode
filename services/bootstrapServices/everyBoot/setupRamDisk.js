const util = require('util');
const exec = util.promisify(require('child_process').exec);
const debug = require('debug')('setupRamDisk');
debug.enabled = true
const fs = require('fs');

async function createRamDisk() {
  var success = true;

  var { stdout, stderr } = await exec('sudo mkdir -p /mnt/ramdisk');

  debug("Created Directory Successfully");

  try {
    var { stdout, stderr } = await exec('sudo umount /mnt/ramdisk');
    debug("umounted /mnt/ramdisk for idempotency");
  } catch(err) {}

  var { stdout, stderr } = await exec('sudo chown -R pi:pi /mnt/ramdisk');
  debug("Modified permissions successfully");


  var { stdout, stderr } = await exec('sudo mount -osize=100M -t tmpfs tmpfs /mnt/ramdisk');
  debug("Successfully mounted ramdisk");
}

async function run() {
  debug("Beginning Ram Disk Setup Procedure");

  debug("Checking for ram disk...");

  var shouldCreate = false;

  try {
    var {stdout, stderr} = await exec(`mount | grep 'tmpfs on /mnt/ramdisk'`);
  } catch(error) {
    shouldCreate = true;
  }

  if(shouldCreate) {
    await createRamDisk();
  } else {
    debug("Ram Disk mounted. Skipping");
  }

  await exec(`mkdir -p /mnt/ramdisk/services`);

  debug("Completed Ram Disk Setup Procedure");
}

module.exports = {
  run
}
