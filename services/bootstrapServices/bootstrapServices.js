const debug = require('debug')('bootstrapServices');
debug.enabled = true
const fs = require('fs')

async function oneTime() {
  debug("Beginning oneTime Boot Procedures");

  debug("Checking for previous run...");

  var result = "";

  try { result = fs.readFileSync('/mnt/ramdisk/oneTimeCompleted') } catch(err) {}

  if(result == "true") {
    debug("One Time Setup has been completed. Skipping");
  } else {
    await require("./once/setHostname.js").run();
    await require("./once/setupFirewallRules.js").run();
    await require("./once/updateHosts.js").run();
    await require("./once/updatePoeDhcp.js").run();
  }

  debug("Completed oneTime Boot Procedures");
  fs.writeFile("/mnt/ramdisk/oneTimeCompleted", "true", function (error) {});
}

async function everyBoot() {
  debug("Beginning everyBoot Procedures");
  await require("./everyBoot/setupRamDisk").run();
  await require("./everyBoot/cacheCameraConfig").run();
  await require("./everyBoot/setupStorage").run()
  await require("./everyBoot/hwStatus").run()
  debug("Completed everyBoot Procedures");
}

async function run() {
  debug("Beginning Bootstrap Procedure");

  await everyBoot();
  await oneTime();

  debug("Completed Bootstrap Procedure");
}

module.exports = {
  run
}
