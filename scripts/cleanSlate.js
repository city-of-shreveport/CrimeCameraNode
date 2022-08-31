// quick and dirty system to get us to a clean slate
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs=require('fs');

async function execCommand(cmd,clean=cmd) {
	console.log(`Running ${clean}...`)
	try {
		return exec(cmd);
	}
	catch(e) {
		// whatever
	}
}

async function run() {
	if(process.argv[2]!="-pm2")
		await execCommand('pm2 stop all')
	await execCommand('sudo umount /mnt/ramdisk')
	await execCommand('sudo umount /home/pi/videos')
	await execCommand('sudo umount /home/pi/remote_backups')
	var map=fs.readdirSync('/dev/mapper').filter(o=>o!='control');
	for(var i=0;i<map.length;i++) {
		await execCommand('sudo cryptsetup --batch-mode -d - luksClose /dev/mapper/'+map[i],'sudo cryptsetup --batch-mode -d - luksClose /dev/mapper/<drive>')
	}
	console.log("")
	console.log("Done")
}

run();
