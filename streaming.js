const { exec, execSync, spawn } = require('child_process');
var child1
var child2
var child3
const formatArguments = (template) => {
    return template
      .replace(/\s+/g, ' ')
      .replace(/\s/g, '\n')
      .split('\n')
      .filter((arg) => (arg != '' ? true : false));
  };
 child1 = spawn(
    '/home/pi/u/tool/ffserver/bin/ffmpeg',
    formatArguments(`

      -rtsp_transport tcp
      -i rtsp://admin:UUnv9njxg123@10.10.5.2/cam/realmonitor?channel=1&subtype=1
      -r 15 
      -an http://127.0.0.1:8090/camera1.ffm
      
     
    `)
  );
  child1.on("close", function() {
    // Wait for process to exit, then run again
});

  child1.stderr.on('data', (data) => {
    console.error(`${data}`);
 
  });





  child2 = spawn(
    '/home/pi/u/tool/ffserver/bin/ffmpeg',
    formatArguments(`

      -rtsp_transport tcp
      -i rtsp://admin:UUnv9njxg123@10.10.5.3/cam/realmonitor?channel=1&subtype=1
      -r 15 
      -an http://127.0.0.1:8091/camera2.ffm
      
     
    `)
  );
  child2.on("close", function() {
    // Wait for process to exit, then run again
});

  child2.stderr.on('data', (data) => {
    console.error(`${data}`);
 
  });

  child3 = spawn(
    '/home/pi/u/tool/ffserver/bin/ffmpeg',
    formatArguments(`

      -rtsp_transport tcp
      -i rtsp://admin:UUnv9njxg123@10.10.5.4/cam/realmonitor?channel=1&subtype=1
      -r 15 
      -an http://127.0.0.1:8092/camera3.ffm
      
     
    `)
  );
  child3.on("close", function() {
    // Wait for process to exit, then run again
});

  child3.stderr.on('data', (data) => {
    console.error(`${data}`);
 
  });