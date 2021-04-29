var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};
const dreamHost = require('socket.io-client');
var os = require('os');
var ifaces = os.networkInterfaces();
var os2 = require('os');
var zeroTierIP;
var eth0IP;
var eth1IP;
var networkInterfaces = os2.networkInterfaces();
const vids = require('./models/videos');
const perfmons = require('./models/perfmons');
const cams = require('/home/pi/CrimeCameraClient/models/cameras');
const glob = require('glob');
const fs = require('fs');
const mongoose = require('mongoose');
var ffmpeg = require('fluent-ffmpeg');
var interfaceNames = Object.keys(networkInterfaces);
const { exec, execSync } = require('child_process');
require('events').EventEmitter.prototype._maxListeners = 100;
const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const $ = require('jquery')(window);
const http = require('http');
const si = require('systeminformation');
var chokidar = require('chokidar');
const moment = require('moment');
var watcher = chokidar.watch('/home/pi//videos/cam3', { ignored: /^\./, persistent: true });
var spawn = require('child_process').spawn,
  child = null;

var videoFilescam1 = [];
var videoFilescam2 = [];
var videoFilescam3 = [];
for (i = 0; i < interfaceNames.length; i++) {
  if (interfaceNames[i] === 'eth0') {
    // console.log(networkInterfaces[interfaceNames[i]][0].address);
    eth0IP = networkInterfaces[interfaceNames[i]][0].address;
  }
  if (interfaceNames[i] === 'eth1') {
    // console.log(networkInterfaces[interfaceNames[i]][0].address);
    eth1IP = networkInterfaces[interfaceNames[i]][0].address;
  }
  if (interfaceNames[i].startsWith('z')) {
    for (j = 0; j < networkInterfaces[interfaceNames[i]].length; j++) {
      if (networkInterfaces[interfaceNames[i]][j].family === 'IPv4') {
        // console.log(networkInterfaces[interfaceNames[i]][j].address);
        zeroTierIP = networkInterfaces[interfaceNames[i]][j].address;
      }
    }
  }
}
var socket2 = dreamHost('http://10.10.10.52:3001/cameras', {
  autoConnect: true,
});

mongoose.connect(
  'mongodb://localhost/cameras',
  {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  function (err) {
    if (err) throw err;

    var sysInfo = {
      diskLayout: [],
      osInfo: {},
    };
    var systemInfo = {
      name: os.hostname(),
      id: 'jhgwesd',
      ip: '10.10.10.100',
      numOfCams: 3,
      typs: 'standard',
      sysInfo: sysInfo,
      location: {
        lat: 38.65456,
        lng: -77.435076,
      },
    };
    var perfmonPacket = {
      camera: os.hostname(),
      currentLoad: {
        cpus: [],
      },
      mem: {},
      cpuTemperature: {},
      fsSize: [],
    };
    si.osInfo(function (data) {
      sysInfo.osInfo.distro = data.distro;
      sysInfo.osInfo.release = data.release;
      sysInfo.osInfo.codename = data.codename;
      sysInfo.osInfo.kernel = data.kernel;
      sysInfo.osInfo.arch = data.arch;
      sysInfo.osInfo.hostname = data.hostname;
      sysInfo.osInfo.fqdn = data.fqdn;
    });
    si.diskLayout(function (data) {
      for (var i = 0; i < data.length; i++) {
        sysInfo.diskLayout.push({
          device: data[i].device,
          type: data[i].type,
          type: data[i].name,
          vendor: data[i].vendor,
          size: data[i].size,
        });
      }
    });
    si.osInfo(function (data) {
      sysInfo.osInfo.distro = data.distro;
      sysInfo.osInfo.release = data.release;
      sysInfo.osInfo.codename = data.codename;
      sysInfo.osInfo.kernel = data.kernel;
      sysInfo.osInfo.arch = data.arch;
      sysInfo.osInfo.hostname = data.hostname;
      sysInfo.osInfo.fqdn = data.fqdn;
    });
    si.memLayout(function (data) {
      sysInfo.memLayout = data;
    });
    si.cpu(function (data) {
      sysInfo.cpu = data;
    });
    const sleep = (time) => {
      return new Promise((resolve) => setTimeout(resolve, time));
    };
    function checkVidInDB(path, camera) {
      vids.exists(
        {
          fileLocation: path,
        },
        function (err, doc) {
          //console.log(doc)
          if (err) {
          } else {
            if (!doc) {
              try {
                ffmpeg.ffprobe(path, function (err, metadata) {
                  try {
                    if (metadata) {
                      var date = metadata.format.filename;
                      // console.log(date);
                      var sperateddate = date.split('/');
                      // console.log(sperateddate[5]);
                      var fileString = sperateddate[5];
                      // console.log(fileString);
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
                        node: systemInfo.name,
                        nodeID: systemInfo.id,
                        fileLocation: metadata.format.filename,
                        location: {
                          lat: systemInfo.location.lat,
                          lng: systemInfo.location.lng,
                        },
                        start_pts: metadata.format.start_pts,
                        start_time: metadata.format.start_time,
                        duration: metadata.format.duration,
                        bit_rate: metadata.format.bit_rate,
                        height: metadata.streams[0].height,
                        width: metadata.streams[0].width,
                        size: metadata.format.size,
                        DateTime: dateTimeString,
                        //rshash: execSync(`sha1sum ${metadata.format.filename}`),
                      });
                      vid.save();
                    }
                  } catch (error) {
                    //console.log(error)
                  }

                  if (err) {
                  }
                });
              } catch (error) {
                //console.log(error)
              }
            }
          }
        }
      );
    }
    const updateCam1 = async () => {
      for (let i = 0; i < videoFilescam1.length; i++) {
        await sleep(100);
        checkVidInDB(videoFilescam1[i], 'cam1');
      }
    };
    const updateCam2 = async () => {
      for (let i = 0; i < videoFilescam2.length; i++) {
        await sleep(100);
        checkVidInDB(videoFilescam2[i], 'cam2');
      }
    };
    const updateCam3 = async () => {
      for (let i = 0; i < videoFilescam3.length; i++) {
        await sleep(100);
        checkVidInDB(videoFilescam3[i], 'cam3');
      }
    };
    function getVideoFiles() {
      exec('ls /home/pi/videos/cam1', function (error, stdout, stderr) {
        if (error) {
          console.log(error);
        }
        if (!error) {
          videoFilescam1.length = 0;
          var newStringArray = stdout.split('\n');
          //newStringArray = toString(newStringArray)

          for (y = 0; y < newStringArray.length; y++) {
            if (newStringArray[y]) {
              videoFilescam1.push('/home/pi/videos/cam1/' + newStringArray[y]);
              ///checkVidInDB(videoPath)
            }
            if (y == newStringArray.length - 1) {
              updateCam1();
              setTimeout(() => {
                exec('ls /home/pi/videos/cam2', function (error, stdout, stderr) {
                  if (error) {
                  }
                  if (!error) {
                    videoFilescam2.length = 0;
                    var newStringArray = stdout.split('\n');
                    //newStringArray = toString(newStringArray)
                    for (y = 0; y < newStringArray.length; y++) {
                      if (newStringArray[y]) {
                        videoFilescam2.push('/home/pi/videos/cam2/' + newStringArray[y]);

                        ///checkVidInDB(videoPath)
                      }
                      if (y == newStringArray.length - 1) {
                        updateCam2();
                        setTimeout(() => {
                          exec('ls /home/pi/videos/cam3', function (error, stdout, stderr) {
                            if (error) {
                            }
                            if (!error) {
                              videoFilescam3.length = 0;
                              var newStringArray = stdout.split('\n');
                              //newStringArray = toString(newStringArray)
                              for (y = 0; y < newStringArray.length; y++) {
                                if (newStringArray[y]) {
                                  videoFilescam3.push('/home/pi/videos/cam3/' + newStringArray[y]);

                                  ///checkVidInDB(videoPath)
                                }
                                if (y == newStringArray.length - 1) {
                                  updateCam3();
                                }
                              }
                            }
                          });
                        }, 3000);
                      }
                    }
                  }
                });
              }, 3000);
            }
          }
        }
      });
    }
    function upDateCamData() {
      var dateNOW = moment().toISOString();
      socket2.emit('systemOnline', systemInfo);
      cams.exists(
        {
          nodeName: systemInfo.name,
        },
        function (err, doc) {
          if (err) {
          } else {
            if (doc == false) {
              const cam = new cams({
                nodeName: systemInfo.name,
                id: systemInfo.id,
                location: {
                  lat: systemInfo.location.lat,
                  lng: systemInfo.location.lng,
                },
                ip: systemInfo.ip,
                numOfCams: systemInfo.numOfCams,
                systemType: systemInfo.typs,
                lastCheckIn: dateNOW,
                sysInfo: systemInfo.sysInfo,
              });
              cam.save();
            }

            if (doc == true) {
              cams.findOneAndUpdate(
                {
                  nodeName: systemInfo.name,
                },
                {
                  lastCheckIn: dateNOW,
                },
                null,
                function (err, docs) {
                  if (err) {
                  } else {
                  }
                }
              );
            }
          }
        }
      );
    }
    function grabPerfMonData() {
      si.fsSize(function (data) {
        for (var i = 0; i < data.length; i++) {
          perfmonPacket.fsSize.push({
            fs: data[i].fs,
            type: data[i].type,
            size: data[i].size,
            used: data[i].used,
            available: data[i].available,
            mount: data[i].mount,
          });
        }
      });
      si.cpuTemperature(function (data) {
        perfmonPacket['cpuTemperature'].main = data.main;
      });
      si.mem(function (data) {
        perfmonPacket['mem']['total'] = data.total;
        perfmonPacket['mem']['free'] = data.free;
        perfmonPacket['mem']['used'] = data.used;
        perfmonPacket['mem']['available'] = data.available;
      });
      si.currentLoad(function (data) {
        perfmonPacket.currentLoad.cpus = [];
        perfmonPacket.currentLoad.avgLoad = data.avgLoad;
        perfmonPacket.currentLoad.currentLoad = data.currentLoad;
        perfmonPacket.currentLoad.currentLoadUser = data.currentLoadUser;
        for (var i = 0; i < data.cpus.length; i++) {
          perfmonPacket.currentLoad.cpus.push(data.cpus[i].load);
        }
      });
      const perf = new perfmons(perfmonPacket);
      perf.save();
      perfmonPacket.fsSize.length = 0;
    }
    function executeCommand(command) {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return;
        }
        if (stderr) {
          return;
        }
      });
    }

    function createCameraItemDB(data) {
      si.diskLayout(function (data) {
        for (var i = 0; i < data.length; i++) {
          sysInfo.diskLayout.push({
            device: data[i].device,
            type: data[i].type,
            type: data[i].name,
            vendor: data[i].vendor,
            size: data[i].size,
          });
        }
      });

      si.osInfo(function (data) {
        sysInfo.osInfo.distro = data.distro;
        sysInfo.osInfo.release = data.release;
        sysInfo.osInfo.codename = data.codename;
        sysInfo.osInfo.kernel = data.kernel;
        sysInfo.osInfo.arch = data.arch;
        sysInfo.osInfo.hostname = data.hostname;
        sysInfo.osInfo.fqdn = data.fqdn;
      });

      si.memLayout(function (data) {
        sysInfo.memLayout = data;
      });

      si.cpu(function (data) {
        sysInfo.cpu = data;
      });
    }

    function Startrecording() {
      child = spawn('ffmpeg', [
        '-hide_banner',

        '-i',
        'rtsp://admin:UUnv9njxg@10.10.5.2:554/cam/realmonitor?channel=1&subtype=0',
        '-vcodec',
        'copy',
        '-f',
        'segment',
        '-strftime',
        '1',
        '-segment_time',
        '300',
        '-segment_format',
        'mp4',
        '/home/pi/videos/cam1/%Y-%m-%d_%H-%M.mp4',
      ]);
      child.stdout.on('data', (data) => {});
      child.stderr.on('data', (data) => {});

      child2 = spawn('ffmpeg', [
        '-hide_banner',

        '-i',
        'rtsp://admin:UUnv9njxg@10.10.5.3:554/cam/realmonitor?channel=1&subtype=0',
        '-vcodec',
        'copy',
        '-f',
        'segment',
        '-strftime',
        '1',
        '-segment_time',
        '300',
        '-segment_format',
        'mp4',
        '/home/pi/videos/cam2/%Y-%m-%d_%H-%M.mp4',
      ]);
      child2.stdout.on('data', (data2) => {});
      child2.stderr.on('data', (data2) => {});

      child3 = spawn('ffmpeg', [
        '-hide_banner',

        '-i',
        'rtsp://admin:UUnv9njxg@10.10.5.4:554/cam/realmonitor?channel=1&subtype=0',
        '-vcodec',
        'copy',
        '-f',
        'segment',
        '-strftime',
        '1',
        '-segment_time',
        '300',
        '-segment_format',
        'mp4',
        '/home/pi/videos/cam3/%Y-%m-%d_%H-%M.mp4',
      ]);
      child3.stdout.on('data', (data3) => {});
      child3.stderr.on('data', (data3) => {});
    }

    //Starts all functions
    upDateCamData();
    Startrecording();

    setTimeout(() => {
      getVideoFiles();
    }, 5000);
    //store perfmon data once a min
    setInterval(grabPerfMonData, 60000);
    //HEat BEat and check in every 5 min
    setInterval(upDateCamData, 10000);
    //get video files every 30 min
    setInterval(getVideoFiles, 900000);
  }
);

socketApi.io = io;

module.exports = socketApi;
