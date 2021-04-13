var chokidar = require('chokidar');
var watcher = chokidar.watch('/home/pi/CrimeCamera/public/videos/cam1', {ignored: /^\./, persistent: true});
const vids = require('./models/videos');
var addedFIles = []
const fs = require("fs")
const glob = require('glob')
var ffmpeg = require('fluent-ffmpeg');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/cameras', function (err) {
  if (err) throw err;
  console.log('Successfully connected');
});
const newestFile = glob.sync('/home/pi/CrimeCamera/public/videos/cam1/*mp4')
  .map(name => ({name, ctime: fs.statSync(name).ctime}))
  .sort((a, b) => b.ctime - a.ctime)[1].name

  //console.log(newestFile)
  //checkFileinDB(newestFile)
var os = require('os');
var systemInfo = {
    "name": os.hostname(),
    'id': 'jhgwesd',
    "ip": "192.168.196.164",
    "numOfCams": 3,
    "typs": "standard",
    'location': {
        'lat': 38.65456,
        'lng': -77.435076
    },
}  


function checkFileinDB(path){
   ffmpeg.ffprobe(path, function (err, metadata) {
                     console.log(metadata)
                    var camera = 'cam1';
                    var date = metadata.format.filename;
                    var sperateddate = date.split('/');
                    var fileString = sperateddate[7];
                    var splitFileString = fileString.split('_');
                    var fileData = splitFileString[0];
                    var fileTimewithExtention = splitFileString[1];
                    var fileTimesplit = fileTimewithExtention.split('.');
                    var fileTime = fileTimesplit[0];
                    var fileTimeCelaned = fileTime.split('-');
                    var dateTime = fileData + ' ' + fileTimeCelaned[0] + ':' + fileTimeCelaned[1] + ':00';
                    var dateTimeString = moment(dateTime).toISOString();
                    const vid = new vids({
                        camera: camera,
                        node: camera.name,
                        nodeID: camera.id,
                        fileLocation: metadata.format.filename,
                        location: {
                        lat: camera.location.lat,
                        lng: camera.location.lng,
                        },
                        start_pts: metadata.format.start_pts,
                        start_time: metadata.format.start_time,
                        duration: metadata.format.duration,
                        bit_rate: metadata.format.bit_rate,
                        height: metadata.streams[0].height,
                        width: metadata.streams[0].width,
                        size: metadata.format.size,
                        DateTime: dateTimeString,
                    });
                    vid.save();
                
                
                if (err) {
                    console.log(err)
                }
            });

    }