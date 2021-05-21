// require basic
const $ = require('jquery')(window);
const { window } = new JSDOM('');
const serverSocket = require('socket.io-client');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const glob = require('glob');
const http = require('http');
const moment = require('moment');
const mongoose = require('mongoose');
const os = require('os');
const os2 = require('os');
const si = require('systeminformation');
const socket_io = require('socket.io');
const io = socket_io();
const spawn = require('child_process').spawn,
  child = null;
const Videos = require('./models/videos');
const { JSDOM } = require('jsdom');
const { exec } = require('child_process');

// require models
const Nodes = require('./models/nodes');
const PerfMons = require('./models/perfMons');

var socketApi = {};
var videoFilesCamera1 = [];
var videoFilesCamera2 = [];
var videoFilesCamera3 = [];

var serverSocket = server('https://crime-camera-system-api.shreveport-it.org', {
  autoConnect: true,
});

mongoose.connect(
  'mongodb://localhost/CrimeCameraSystem',
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
      sysInfo: sysInfo,
    };

    var perfMonPacket = {
      node: os.hostname(),
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
      Videos.exists(
        {
          fileLocation: path,
        },
        function (error, doc) {
          if (error) {
            console.log(error);
          } else {
            if (!doc) {
              try {
                ffmpeg.ffprobe(path, function (error, metadata) {
                  try {
                    if (metadata) {
                      var date = metadata.format.filename;
                      var sperateddate = date.split('/');
                      var fileString = sperateddate[5];
                      var splitFileString = fileString.split('_');
                      var fileData = splitFileString[0];
                      var fileTimewithExtention = splitFileString[1];
                      var fileTimesplit = fileTimewithExtention.split('.');
                      var fileTime = fileTimesplit[0];
                      var fileTimeCelaned = fileTime.split('-');
                      var dateTime = fileData + ' ' + fileTimeCelaned[0] + ':' + fileTimeCelaned[1] + ':00';
                      var dateTimeString = moment(dateTime).toISOString();

                      new Videos({
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
                      }).save();
                    }
                  } catch (error) {
                    console.log(error);
                  }
                  if (error) {
                    console.log(error);
                  }
                });
              } catch (error) {
                console.log(error);
              }
            }
          }
        }
      );
    }

    const updateCamera1 = async () => {
      for (let i = 0; i < videoFilesCamera1.length; i++) {
        await sleep(100);
        checkVidInDB(videoFilesCamera1[i], 'camera1');
      }
    };

    const updateCamera2 = async () => {
      for (let i = 0; i < videoFilesCamera2.length; i++) {
        await sleep(100);
        checkVidInDB(videoFilesCamera2[i], 'camera2');
      }
    };

    const updateCamera3 = async () => {
      for (let i = 0; i < videoFilesCamera3.length; i++) {
        await sleep(100);
        checkVidInDB(videoFilesCamera3[i], 'camera3');
      }
    };

    function getVideoFiles() {
      exec('ls /home/pi/videos/camera1', function (error, stdout, stderr) {
        if (error) {
          console.log(error);
        }

        if (!error) {
          videoFilesCamera1.length = 0;
          var newStringArray = stdout.split('\n');

          for (y = 0; y < newStringArray.length; y++) {
            if (newStringArray[y]) {
              videoFilesCamera1.push('/home/pi/videos/camera1/' + newStringArray[y]);
            }

            if (y == newStringArray.length - 1) {
              updateCamera1();

              setTimeout(() => {
                exec('ls /home/pi/videos/camera2', function (error, stdout, stderr) {
                  if (error) {
                    console.log(error);
                  } else {
                    videoFilesCamera2.length = 0;
                    var newStringArray = stdout.split('\n');

                    for (y = 0; y < newStringArray.length; y++) {
                      if (newStringArray[y]) {
                        videoFilesCamera2.push('/home/pi/videos/camera2/' + newStringArray[y]);
                      }

                      if (y == newStringArray.length - 1) {
                        updateCamera2();

                        setTimeout(() => {
                          exec('ls /home/pi/videos/camera3', function (error, stdout, stderr) {
                            if (error) {
                              console.log(error);
                            } else {
                              videoFilesCamera3.length = 0;
                              var newStringArray = stdout.split('\n');

                              for (y = 0; y < newStringArray.length; y++) {
                                if (newStringArray[y]) {
                                  videoFilesCamera3.push('/home/pi/videos/camera3/' + newStringArray[y]);
                                }

                                if (y == newStringArray.length - 1) {
                                  updateCamera3();
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

    function updateCameraData() {
      serverSocket.emit(
        Nodes.exists({
          node: systemInfo.name,
        }),
        function (err, doc) {
          if (err) {
          } else {
            if (doc == false) {
              const node = new Nodes({
                node: systemInfo.name,
                sysInfo: systemInfo.sysInfo,
              }).save();
            }

            if (doc == true) {
              Nodes.findOneAndUpdate(
                {
                  node: systemInfo.name,
                },
                {
                  lastCheckIn: moment().toISOString(),
                },
                null
              );
            }
          }
        }
      );
    }

    function grabPerfMonData() {
      si.fsSize(function (data) {
        for (var i = 0; i < data.length; i++) {
          perfMonPacket.fsSize.push({
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
        perfMonPacket['cpuTemperature'].main = data.main;
      });

      si.mem(function (data) {
        perfMonPacket['mem']['total'] = data.total;
        perfMonPacket['mem']['free'] = data.free;
        perfMonPacket['mem']['used'] = data.used;
        perfMonPacket['mem']['available'] = data.available;
      });

      si.currentLoad(function (data) {
        perfMonPacket.currentLoad.cpus = [];
        perfMonPacket.currentLoad.avgLoad = data.avgLoad;
        perfMonPacket.currentLoad.currentLoad = data.currentLoad;
        perfMonPacket.currentLoad.currentLoadUser = data.currentLoadUser;
        for (var i = 0; i < data.cpus.length; i++) {
          perfMonPacket.currentLoad.cpus.push(data.cpus[i].load);
        }
      });

      const perf = new PerfMons(perfMonPacket).save();
      perfMonPacket.fsSize.length = 0;
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
      cameraRecording1 = spawn('ffmpeg', [
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
        '/home/pi/videos/camera1/%Y-%m-%d_%H-%M.mp4',
      ]);

      cameraRecording1.stdout.on('data', (data) => {});
      cameraRecording1.stderr.on('data', (data) => {});

      cameraRecording2 = spawn('ffmpeg', [
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
        '/home/pi/videos/camera2/%Y-%m-%d_%H-%M.mp4',
      ]);

      cameraRecording2.stdout.on('data', (data) => {});
      cameraRecording2.stderr.on('data', (data) => {});

      cameraRecording3 = spawn('ffmpeg', [
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
        '/home/pi/videos/camera3/%Y-%m-%d_%H-%M.mp4',
      ]);

      cameraRecording3.stdout.on('data', (data) => {});
      cameraRecording3.stderr.on('data', (data) => {});
    }

    updateCameraData();
    Startrecording();

    setTimeout(() => {
      getVideoFiles();
    }, 5000);

    setInterval(grabPerfMonData, 60000);
    setInterval(updateCameraData, 10000);
    setInterval(getVideoFiles, 900000);
  }
);

socketApi.io = io;

module.exports = socketApi;
