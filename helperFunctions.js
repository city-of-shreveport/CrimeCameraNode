// require basic
const dedent = require('dedent-js');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('@mh-cbon/sudo-fs');
const moment = require('moment');
const si = require('systeminformation');
const { exec, execSync, spawn } = require('child_process');

// require models
const videos = require('./models/videos');

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

const bootstrapApp = async (config) => {
  try {
    console.log('Resetting firewall and routing rules...');
    await execCommand(dedent`
      sudo iptables -P INPUT ACCEPT;
      sudo iptables -P FORWARD ACCEPT;
      sudo iptables -P OUTPUT ACCEPT ;
      sudo iptables -t nat -F;
      sudo iptables -t mangle -F;
      sudo iptables -t raw -F;
      sudo iptables -F;
      sudo iptables -X;
      sudo route del -net default gw 10.10.5.1 netmask 0.0.0.0 dev eth0 metric 202;
    `);

    console.log('Setting hostname...');
    await execCommand(`sudo hostname ${config.hostName}`);

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
        interface eth0
        static ip_address=10.10.5.1/24
        static routers=10.10.5.1/24
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
    writeFile('/etc/default/isc-dhcp-server', 'INTERFACESv4="eth0"');

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
      sudo iptables -P INPUT ACCEPT;
      sudo iptables -P FORWARD ACCEPT;
      sudo iptables -P OUTPUT ACCEPT;
      sudo iptables -t nat -F;
      sudo iptables -t mangle -F;
      sudo iptables -t raw -F;
      sudo iptables -F;
      sudo iptables -X;

      sudo sysctl net.ipv4.conf.eth0.forwarding=1;
      sudo sysctl net.ipv4.conf.eth1.forwarding=1;
      sudo sysctl net.ipv4.conf.wlan0.forwarding=1;
      sudo sysctl net.ipv4.conf.ztuga7sx7i.forwarding=1;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 554 -j DNAT --to 10.10.5.2:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 554 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 81 -j DNAT --to 10.10.5.2:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 80 -j ACCEPT;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 555 -j DNAT --to 10.10.5.3:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 555 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 82 -j DNAT --to 10.10.5.3:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 81 -j ACCEPT;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 556 -j DNAT --to 10.10.5.4:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 556 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 83 -j DNAT --to 10.10.5.4:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 82 -j ACCEPT;

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

const startRecording = async () => {
  const cameras = [
    { address: '10.10.5.2:554', folder: 'camera1' },
    { address: '10.10.5.3:554', folder: 'camera2' },
    { address: '10.10.5.4:554', folder: 'camera3' },
  ];

  for (var i = 0; i < cameras.length; i++) {
    console.log(`Spawning ffmpeg for ${cameras[i].folder}/${cameras[i].address}...`);
    await execCommand(`mkdir -p /home/pi/videos/${cameras[i].folder}/`);

    spawn(
      'ffmpeg',
      formatArguments(`
        -hide_banner
        -i rtsp://${process.env.CAMERA_USER}:${process.env.CAMERA_PASSWORD}@${cameras[i].address}/cam/realmonitor?channel=1&subtype=0
        -vcodec copy
        -f segment
        -strftime 1
        -segment_time 300
        -segment_format mp4
        /home/pi/videos/${cameras[i].folder}/%Y-%m-%d_%H-%M.mp4
      `)
    );
  }
};

const stopRecording = async () => {
  await execCommand(`sudo killall ffmpeg`);
};

const uploadSysInfo = async (config) => {
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

  console.log(sysInfo);
};

const uploadPerfMon = async (config) => {
  var perfMon = {
    camera: config.hostName,
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

  console.log(perfMon);
};

const uploadVideos = async (config) => {
  const cameras = ['camera1', 'camera2', 'camera3'];

  for (var c = 0; c < cameras.length; c++) {
    const fileList = await execCommand(`ls /home/pi/videos/${cameras[c]}`);
    const videoFiles = fileList.split('\n').filter((file) => file !== '');

    for (var v = 0; v < videoFiles.length; v++) {
      ffmpeg.ffprobe(`/home/pi/videos/${cameras[c]}/${videoFiles[v]}`, function (error, metadata) {
        let yearMonthDay = metadata.format.filename.split('/')[5].split('_')[0];
        let hour = metadata.format.filename.split('/')[5].split('_')[1].split('.')[0].split('-')[0];
        let minute = metadata.format.filename.split('/')[5].split('_')[1].split('.')[0].split('-')[1];
        let dateTime = moment(`${yearMonthDay} ${hour}:${minute}:00`).unix();

        videos.findOneAndUpdate(
          {
            node: config.hostName,
            fileLocation: metadata.format.filename,
          },
          {
            node: config.hostName,
            fileLocation: metadata.format.filename,
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
            dateTime: dateTime,
            camera: `${cameras[c]}`,
            hash: execSync(`sha1sum ${metadata.format.filename}`).toString(),
          },
          { upsert: true }
        );
      });
    }
  }

  videos.find({}, function (err, docs) {
    console.log(docs.length);
    console.log(docs[0]);
  });
};

module.exports = {
  bootstrapApp,
  execCommand,
  formatArguments,
  mountStorageDrive,
  setupStorageDrive,
  startRecording,
  stopRecording,
  uploadPerfMon,
  uploadSysInfo,
  uploadVideos,
};
