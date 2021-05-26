var ifaces = os.networkInterfaces();
var networkInterfaces = os2.networkInterfaces();
var interfaceNames = Object.keys(networkInterfaces);

for (i = 0; i < interfaceNames.length; i++) {
  if (interfaceNames[i] === 'eth0') {
    eth0IP = networkInterfaces[interfaceNames[i]][0].address;
  }

  if (interfaceNames[i] === 'eth1') {
    eth1IP = networkInterfaces[interfaceNames[i]][0].address;
  }

  if (interfaceNames[i].startsWith('z')) {
    for (j = 0; j < networkInterfaces[interfaceNames[i]].length; j++) {
      if (networkInterfaces[interfaceNames[i]][j].family === 'IPv4') {
        zeroTierIP = networkInterfaces[interfaceNames[i]][j].address;
      }
    }
  }
}

router.get('/allVideos', async (req, res) => {
  vids.find({}, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.send(docs);
    }
  });
});

router.get('/getCamConfig', async (req, res) => {
  cam.find({}, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.send(docs);
    }
  });
});

var sysInfo = {
  diskLayout: [],
  osInfo: {},
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
            ip: systemInfo.ip,
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
            null
          );
        }
      }
    }
  );
}

var videoFilescam1 = [];
var videoFilescam2 = [];
var videoFilescam3 = [];

function checkVidInDB(path, camera) {
  vids.exists(
    {
      fileLocation: path,
    },
    function (err, doc) {
      if (err) {
      } else {
        if (!doc) {
          try {
            ffmpeg.ffprobe(path, function (err, metadata) {
              try {
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
                var dateTimeString = moment(dateTime).unix();

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
                  hash: execSync(`sha1sum ${metadata.format.filename}`),
                });
                vid.save();
              } catch (error) {}
            });
          } catch (error) {}
        }
      }
    }
  );
}

const updateCam1 = async () => {
  for (let i = 0; i < videoFilescam1.length; i++) {
    await sleep(50);
    checkVidInDB(videoFilescam1[i], 'cam1');
  }
};

const updateCam2 = async () => {
  for (let i = 0; i < videoFilescam2.length; i++) {
    await sleep(50);
    checkVidInDB(videoFilescam2[i], 'cam2');
  }
};

const updateCam3 = async () => {
  for (let i = 0; i < videoFilescam3.length; i++) {
    await sleep(50);
    checkVidInDB(videoFilescam3[i], 'cam3');
  }
};

function getVideoFiles() {
  exec('ls /home/pi/CrimeCameraClient/public/videos/cam1', function (error, stdout, stderr) {
    videoFilescam1.length = 0;
    var newStringArray = stdout.split('\n');

    for (y = 0; y < newStringArray.length; y++) {
      if (newStringArray[y]) {
        videoFilescam1.push('/home/pi/CrimeCameraClient/public/videos/cam1/' + newStringArray[y]);
      }

      if (y == newStringArray.length - 1) {
        updateCam1();

        setTimeout(() => {
          exec('ls /home/pi/CrimeCameraClient/public/videos/cam2', function (error, stdout, stderr) {
            videoFilescam2.length = 0;
            var newStringArray = stdout.split('\n');

            for (y = 0; y < newStringArray.length; y++) {
              if (newStringArray[y]) {
                videoFilescam2.push('/home/pi/CrimeCameraClient/public/videos/cam2/' + newStringArray[y]);
              }

              if (y == newStringArray.length - 1) {
                updateCam2();

                setTimeout(() => {
                  exec('ls /home/pi/CrimeCameraClient/public/videos/cam3', function (error, stdout, stderr) {
                    videoFilescam3.length = 0;
                    var newStringArray = stdout.split('\n');

                    for (y = 0; y < newStringArray.length; y++) {
                      if (newStringArray[y]) {
                        videoFilescam3.push('/home/pi/CrimeCameraClient/public/videos/cam3/' + newStringArray[y]);
                      }

                      if (y == newStringArray.length - 1) {
                        updateCam3();
                      }
                    }
                  });
                }, 2000);
              }
            }
          });
        }, 2000);
      }
    }
  });
}

setInterval(grabPerfMonData, 60000);
setInterval(upDateCamData, 10000);
setInterval(getVideoFiles, 1800000);
