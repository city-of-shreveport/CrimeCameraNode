// require basic
const NodeMediaServer = require('node-media-server');
const axios = require('axios');
const dedent = require('dedent-js');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('@mh-cbon/sudo-fs');
const moment = require('moment');
const promise = require('promise');
const si = require('systeminformation');
const { exec, execSync, spawn } = require('child_process');

// require environment
require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 100;

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve(stdout ? stdout : stderr);
    });
  });
};

const formatArguments = (template) => {
  return template
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '\n')
    .split('\n')
    .filter((arg) => (arg != '' ? true : false));
};

const writeFile = (file, text) => {
  fs.writeFile(file, text, function (error) {});
};

const startMediaServer = async (config) => {
  var hostname = config.hostName;
  const streamconfig = {
    rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },
    http: {
      port: 8000,
      allow_origin: '*',
    },
    relay: {
      ffmpeg: '/usr/bin/ffmpeg',
      tasks: [
        {
          app: hostname,
          mode: 'static',
          edge: 'rtsp://admin:UUnv9njxg123@10.10.5.2:554/cam/realmonitor?channel=1&subtype=1',
          name: 'camera1',
          rtsp_transport: 'tcp',
        },
        {
          app: hostname,
          mode: 'static',
          edge: 'rtsp://admin:UUnv9njxg123@10.10.5.3:554/cam/realmonitor?channel=1&subtype=1',
          name: 'camera2',
          rtsp_transport: 'tcp',
        },
        {
          app: hostname,
          mode: 'static',
          edge: 'rtsp://admin:UUnv9njxg123@10.10.5.4:554/cam/realmonitor?channel=1&subtype=1',
          name: 'camera3',
          rtsp_transport: 'tcp',
        },
      ],
    },
  };

  var nms = new NodeMediaServer(streamconfig);
  nms.run();
};

const bootstrapApp = async (config) => {
  try {
    console.log('Setting hostname...');
    await execCommand(`sudo hostnamectl set-hostname ${config.hostName}`);

    console.log('Updating /etc/hosts...');
    writeFile(
      '/etc/hosts',
      dedent`
        # ipv4
        127.0.0.1 localhost
        127.0.1.1 ${config.hostName}

        # ipv6
        ::1     localhost ip6-localhost ip6-loopback
        ff02::1 ip6-allnodes
        ff02::2 ip6-allrouters
      `
    );

    console.log('Updating /etc/dhcpcd.conf...');
    writeFile(
      '/etc/dhcpcd.conf',
      dedent`
        hostname
        clientid
        persistent
        option rapid_commit
        option domain_name_servers, domain_name, domain_search, host_name
        option classless_static_routes
        option interface_mtu
        require dhcp_server_identifier
        slaac private
        interface eth1
        static ip_address=10.10.5.1/24
      `
    );

    console.log('Updating /etc/dhcp/dhcpd.conf...');
    writeFile(
      '/etc/dhcp/dhcpd.conf',
      dedent`
        option domain-name "crime-camera.local";
        option domain-name-servers 8.8.8.8, 8.8.4.4;

        subnet 10.10.5.0 netmask 255.255.255.0 {
          range 10.10.5.2 10.10.5.4;
          option subnet-mask 255.255.255.0;
          option broadcast-address 10.10.5.255;
          option routers 10.10.5.1;
        }

        default-lease-time 6000;
        max-lease-time 7200;
        authoritative;
      `
    );

    console.log('Updating /etc/default/isc-dhcp-server...');
    writeFile('/etc/default/isc-dhcp-server', 'INTERFACESv4="eth1"');

    if (config.zeroTierNetworkID) {
      console.log('Joining ZeroTier network...');
      await execCommand(dedent`
        curl -s https://install.zerotier.com | sudo bash;
        sudo zerotier-cli join ${config.zeroTierNetworkID};
        sudo service zerotier-one restart;
      `);
    }

    console.log('Setting up firewall rules...');
    await execCommand(dedent`
      sudo sysctl net.ipv4.conf.eth0.forwarding=1;
      sudo sysctl net.ipv4.conf.eth1.forwarding=1;
      sudo sysctl net.ipv4.conf.wlan0.forwarding=1;
      sudo sysctl net.ipv4.conf.ztuga5uslj.forwarding=1;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 554 -j DNAT --to 10.10.5.2:554;
      sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 554 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 81 -j DNAT --to 10.10.5.2:80;
      sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 81 -j ACCEPT;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 555 -j DNAT --to 10.10.5.3:554;
      sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 555 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 82 -j DNAT --to 10.10.5.3:80;
      sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 82 -j ACCEPT;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 556 -j DNAT --to 10.10.5.4:554;
      sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 556 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 83 -j DNAT --to 10.10.5.4:80;
      sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 83 -j ACCEPT;

      sudo iptables -t nat -A POSTROUTING -j MASQUERADE;
    `);

    console.log('Idempotently setting up encryption on video storage devices...');
    await setupStorageDrive(config.videoDriveDevicePath, config.videoDriveMountPath, config.videoDriveEncryptionKey);
    await setupStorageDrive(config.buddyDriveDevicePath, config.buddyDriveMountPath, config.buddyDriveEncryptionKey);
  } catch (error) {
    console.log('Failed to bootstrap the app!');
    console.log(error);
  }
};

const setupStorageDrive = async (devicePath, mountPath, encryptionKey) => {
  var driveIsEncrypted = await execCommand(`sudo lsblk -o NAME,TYPE,SIZE,MODEL | grep ${encryptionKey}`);

  if (driveIsEncrypted.includes(encryptionKey)) {
    mountStorageDrive(devicePath, mountPath, encryptionKey);
  } else {
    var driveIsFormatted = await execCommand(`sudo blkid ${devicePath} | grep crypto_LUKS`);

    if (!driveIsFormatted.includes('crypto_LUKS')) {
      console.log(`Formatting ${devicePath}...`);

      await execCommand(dedent`
        sudo parted --script ${devicePath.slice(0, -1)} mklabel gpt
        sudo parted --script -a opt ${devicePath.slice(0, -1)} mkpart primary ext4 0% 100%
        yes | sudo mkfs -t ext4 ${devicePath}
      `);

      await execCommand(dedent`
        echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat ${devicePath};
        echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
        yes | sudo mkfs -t ext4 /dev/mapper/${encryptionKey};
      `);
    }

    mountStorageDrive(devicePath, mountPath, encryptionKey);
  }
};

const mountStorageDrive = async (devicePath, mountPath, encryptionKey) => {
  console.log(`Mounting ${devicePath} to ${mountPath}...`);
  await execCommand(dedent`
    sudo mkdir -p ${mountPath};
    echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
    sudo mount /dev/mapper/${encryptionKey} ${mountPath};
    sudo chown -R pi:pi ${mountPath};
    sudo chmod 755 -R ${mountPath};
  `);
};

var recordingInterval;

const startRecordingInterval = async () => {
  recordingInterval = setInterval(function () {
    var minutes = new Date().getMinutes();
    var seconds = new Date().getSeconds();

    if ((minutes == 0 && seconds == 0) || (minutes % 15 == 0 && seconds == 0) || process.env.DEBUG == 'true') {
      console.log('Starting recording!');

      const cameras = [
        { address: '10.10.5.2:554', folder: 'camera1' },
        { address: '10.10.5.3:554', folder: 'camera2' },
        { address: '10.10.5.4:554', folder: 'camera3' },
      ];

      for (var i = 0; i < cameras.length; i++) {
        console.log(`Spawning ffmpeg for ${cameras[i].folder}/${cameras[i].address}...`);
        execCommand(`mkdir -p /home/pi/videos/${cameras[i].folder}/`);

        child = spawn(
          'ffmpeg',
          formatArguments(`
            -hide_banner
            -i rtsp://${process.env.CAMERA_USER}:${process.env.CAMERA_PASSWORD}@${cameras[i].address}/cam/realmonitor?channel=1&subtype=0
            -codec copy
            -f segment
            -segment_time 900
            -segment_format mp4
            -strftime 1
            /home/pi/videos/${cameras[i].folder}/%Y-%m-%d-%H-%M.mp4
          `)
        );

        child.stderr.on('data', (data) => {
          console.error(`${data}`);
        });
      }

      stopRecordingInterval();
    } else {
      console.log(`Time: ${minutes}:${seconds}. Waiting for 15-minute recording interval...`);
    }
  }, 1000);
};

const stopRecordingInterval = async () => {
  clearInterval(recordingInterval);
};

const startRecording = async (config) => {
  startRecordingInterval();
};

const stopRecording = async () => {
  await execCommand(`sudo killall ffmpeg`);
};

const uploadSysInfo = async (config) => {
  console.log('Uploading SysInfo...');
  var sysInfo = {
    diskLayout: [],
    osInfo: {},
  };

  await si.diskLayout(function (data) {
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

  await si.osInfo(function (data) {
    sysInfo.osInfo.distro = data.distro;
    sysInfo.osInfo.release = data.release;
    sysInfo.osInfo.codename = data.codename;
    sysInfo.osInfo.kernel = data.kernel;
    sysInfo.osInfo.arch = data.arch;
    sysInfo.osInfo.hostname = data.hostname;
    sysInfo.osInfo.fqdn = data.fqdn;
  });

  await si.cpu(function (data) {
    sysInfo.cpu = data;
  });

  await si.memLayout(function (data) {
    sysInfo.memLayout = data;
  });

  axios.post(`${process.env.NODE_SERVER}/api/nodes/sysInfo/${config.hostName}`, sysInfo);
};

const uploadPerfMon = async (config) => {
  console.log('Uploading PerfMon...');
  var perfMon = {
    node: config.hostName,
    currentLoad: {
      cpus: [],
    },
    mem: {},
    cpuTemperature: {},
    fsSize: [],
  };

  await si.currentLoad(function (data) {
    perfMon.currentLoad.cpus = [];
    perfMon.currentLoad.avgLoad = data.avgLoad;
    perfMon.currentLoad.currentLoad = data.currentLoad;
    perfMon.currentLoad.currentLoadUser = data.currentLoadUser;

    for (var i = 0; i < data.cpus.length; i++) {
      perfMon.currentLoad.cpus.push(data.cpus[i].load);
    }
  });

  await si.mem(function (data) {
    perfMon['mem']['total'] = data.total;
    perfMon['mem']['free'] = data.free;
    perfMon['mem']['used'] = data.used;
    perfMon['mem']['available'] = data.available;
  });

  await si.cpuTemperature(function (data) {
    perfMon['cpuTemperature'].main = data.main;
  });

  await si.fsSize(function (data) {
    for (var i = 0; i < data.length; i++) {
      perfMon.fsSize.push({
        fs: data[i].fs,
        type: data[i].type,
        size: data[i].size,
        used: data[i].used,
        available: data[i].available,
        mount: data[i].mount,
      });
    }
  });

  axios.post(`${process.env.NODE_SERVER}/api/perfmons`, perfMon);
};

const uploadVideos = async (config) => {
  console.log('Uploading Videos...');
  const cameras = ['camera1', 'camera2', 'camera3'];

  for (var c = 0; c < cameras.length; c++) {
    const camera = cameras[c];
    const fileList = await execCommand(`ls /home/pi/videos/${camera}`);
    const videoFiles = fileList.split('\n').filter((file) => file !== '');

    videoFiles.forEach(
      await async function (videoFile) {
        try {
          ffmpeg.ffprobe(`/home/pi/videos/${camera}/${videoFile}`, function (error, metadata) {
            if (videoFiles != undefined && metadata != undefined) {
              let year = parseInt(metadata.format.filename.split('/')[5].split('-')[0]);
              let monthIndex = parseInt(metadata.format.filename.split('/')[5].split('-')[1]) - 1;
              let day = parseInt(metadata.format.filename.split('/')[5].split('-')[2]);
              let hours = parseInt(metadata.format.filename.split('/')[5].split('-')[3]);
              let minutes = parseInt(metadata.format.filename.split('/')[5].split('-')[4]);
              let dateTime = new Date(year, monthIndex, day, hours, minutes);

              videos.exists(
                {
                  node: config.hostName,
                  fileLocation: `${camera}/${videoFile}`,
                },
                function (err, doc) {
                  if (!doc) {
                    new videos({
                      node: config.hostName,
                      fileLocation: `${camera}/${videoFile}`,
                      location: {
                        lat: config.locationLat,
                        lng: config.locationLong,
                      },
                      startPts: metadata.streams[0].start_pts,
                      startTime: metadata.streams[0].start_time,
                      duration: metadata.format.duration,
                      bitRate: metadata.format.bit_rate,
                      height: metadata.streams[0].height,
                      width: metadata.streams[0].width,
                      size: metadata.format.size,
                      camera: camera,
                      dateTime: dateTime,

                      hash: execSync(`sha1sum ${metadata.format.filename}`).toString().split(' ')[0],
                    }).save();
                  }
                }
              );
            }
          });
        } catch (error) {
          console.log(error);
        }
      }
    );
  }

  allVideos = await videos.find({});
  axios.post(`${process.env.NODE_SERVER}/api/videos`, allVideos);
};

module.exports = {
  bootstrapApp,
  execCommand,
  formatArguments,
  mountStorageDrive,
  setupStorageDrive,
  startMediaServer,
  startRecording,
  startRecordingInterval,
  stopRecording,
  stopRecordingInterval,
  uploadPerfMon,
  uploadSysInfo,
  uploadVideos,
};
