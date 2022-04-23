const io = require('@pm2/io')

var chokidar = require('chokidar');
require('dotenv').config();

//This expects the root directory of the videos folder, with camera1, camera2, camera3

var rootDirectory = process.env.WATCH_VIDEO_DIRECTORY
var watchers = []
var lastSeenUpdates = []

var cameraLastSavedVideos = []

for(let i = 0; i < 3; i++) {

  cameraLastSavedVideos[i] = io.counter({
    name: 'camera-' + i + '-saved-videos',
    id: 'saved-videos/cameras/' + i
  });

  var path = rootDirectory + '/camera' + (i + 1).toString();

  console.log("Setting up watch: " + path);

  var watcher = chokidar.watch(path, {ignored: /^\./, persistent: true, usePolling: true})

  watchers[i] = watcher;

  watchers[i]
    .on('add', function(path) {
      console.log('File', path, 'has been added');
      cameraLastSavedVideos[i].inc();
    })
}
