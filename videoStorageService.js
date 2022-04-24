require('dotenv').config();

const { exec, execSync, spawn } = require('child_process');

const ffmpeg = require('fluent-ffmpeg');

const cameras = [
  { address: '10.10.5.2:554', folder: 'camera1',serverPort: '8090' },
  { address: '10.10.5.3:554', folder: 'camera2',serverPort: '8091' },
  { address: '10.10.5.4:554', folder: 'camera3', serverPort: '8092' },
];

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve(stdout ? stdout : stderr);
    });
  });
};

commands = []

function buildCommandForCamera(i) {
  var localCameras = [
    { address: '10.10.5.2:554', folder: 'camera1',serverPort: '8090' },
    { address: '10.10.5.3:554', folder: 'camera2',serverPort: '8091' },
    { address: '10.10.5.4:554', folder: 'camera3', serverPort: '8092' },
  ];

  return ffmpeg()
    .noAudio()
    .input(`rtsp://${process.env.CAMERA_USER}:${process.env.CAMERA_PASSWORD}@${localCameras[i].address}/cam/realmonitor?channel=1&subtype=0`)
    .inputOptions(
      '-hide_banner'
    )
    .videoCodec('copy')
    .output(`/home/${process.env.USER}/videos/${localCameras[i].folder}/%Y-%m-%d-%H-%M.mp4`)
    .outputFormat('segment')
    .outputOptions([
      '-segment_time', '900', 
      '-reset_timestamps', '1', 
      '-segment_format','mp4', 
      'strftime', '1'
    ])
}

for (var i = 0; i < cameras.length; i++) {
  command = buildCommandForCamera(i);

  commands[i] = command
}

for (var i = 0; i < commands.length; i++) {
  command = commands[i]

  execCommand(`mkdir -p /home/${process.env.USER}/videos/${cameras[i].folder}/`);

  command.on('end', function(stdout, stderr) {
    console.log(`ffmpeg process ${i} died. Restarting.`)
    execCommand(`killall ffmpeg`)

  });

  command.on('error', function(err, stdout, stderr) {
    console.error('Cannot process video: ' + err.message);
    console.log(`ffmpeg process ${i} died. Restarting.`)
    execCommand(`killall ffmpeg`)
  });

  command.run()

  console.log(`Spawned ffmpeg for ${cameras[i].folder}/${cameras[i].address}...`);
}
