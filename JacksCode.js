function updatePerfMons() {
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
