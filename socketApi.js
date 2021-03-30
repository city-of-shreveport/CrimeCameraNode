var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};
const dreamHost = require("socket.io-client");
var os = require('os');
var ifaces = os.networkInterfaces();
var os2 = require('os');
var zeroTierIP
var eth0IP
var eth1IP
var networkInterfaces = os2.networkInterfaces();

var interfaceNames = Object.keys(networkInterfaces)
console.log(interfaceNames)
for(i=0;i<interfaceNames.length;i++){
    if(interfaceNames[i] === 'eth0'){
                console.log(networkInterfaces[interfaceNames[i]][0].address)
                eth0IP = networkInterfaces[interfaceNames[i]][0].address

            }
if(interfaceNames[i] === 'eth1'){
                console.log(networkInterfaces[interfaceNames[i]][0].address)
                eth1IP = networkInterfaces[interfaceNames[i]][0].address

            }
    if(interfaceNames[i].startsWith("z")){

      
        for(j=0;j<networkInterfaces[interfaceNames[i]].length;j++){
            if(networkInterfaces[interfaceNames[i]][j].family === 'IPv4'){
                console.log(networkInterfaces[interfaceNames[i]][j].address)
                zeroTierIP = networkInterfaces[interfaceNames[i]][j].address

            }
        }


        }

   



}
const si = require('systeminformation');
var chokidar = require('chokidar');
const moment = require('moment')
var watcher = chokidar.watch('/home/pi/CrimeCamera/public/videos/cam1', {ignored: /^\./, persistent: true});
const cams = require('/home/pi/CrimeCamera/models/cameras');
var addedFIles = []
watcher
  .on('add', function(path) {
    addedFIles.push(path)
})
function intervalFunc4() {
  console.log(addedFIles)
  addedFIles.length = 0
}
setInterval(intervalFunc4, 100000);









const {
exec
} = require("child_process");

require('events').EventEmitter.prototype._maxListeners = 100;

const {
    JSDOM
} = require("jsdom");
const {
    window
} = new JSDOM("");
const $ = require("jquery")(window);
const http = require('http');
/* TRYING TO GET TIME UPDATED ON CAMERAS
var currentDateTimeCamera = moment().format("YYYY-MM-DD HH:mm:ss")
const url = "http://10.10.5.4/cgi-bin/global.cgi?action=setCurrentTime&time="+currentDateTimeCamera;
  console.log(url)
const request = http.request(url, (response) => {
    let data = '';
    response.on('data', (chunk) => {
        data = data + chunk.toString();
    });
  
    response.on('end', () => {
        
        console.log(response);
    });
})
  
request.on('error', (error) => {
    console.log('An error', error);
});
  
request.end() 


//http://10.10.5.3/cgi-bin/global.cgi?action=setCurrentTime&time="+currentDateTimeCamera
//http://10.10.5.4/cgi-bin/global.cgi?action=setCurrentTime&time="+currentDateTimeCamera

*/




var fileNameTImeStamp = moment().format("YYYY-MM-DD-HHmm");

var spawn = require('child_process').spawn,
    child = null;
var sysInfo = {
    'diskLayout': [],
    'osInfo': {},



}
si.osInfo(function (data) {
    sysInfo.osInfo.distro = data.distro
    sysInfo.osInfo.release = data.release
    sysInfo.osInfo.codename = data.codename
    sysInfo.osInfo.kernel = data.kernel
    sysInfo.osInfo.arch = data.arch
    sysInfo.osInfo.hostname = data.hostname
    sysInfo.osInfo.fqdn = data.fqdn
})

var systemInfo = {
    "name": os.hostname(),
    'id': 'jhgwesd',
    "ip": "192.168.196.164",
    "numOfCams": 3,
    "typs": "standard",
    'sysInfo': sysInfo,
    'location': {
        'lat': 38.65456,
        'lng': -77.435076
    },
}


var perfmonPacket = {
    'camera': os.hostname(),
    'currentLoad': {
        'cpus': []
    },
    'mem': {},
    'cpuTemperature': {},
    'fsSize': []
}

si.diskLayout(function (data) {
    for (var i = 0; i < data.length; i++) {
        sysInfo.diskLayout.push({
            'device': data[i].device,
            'type': data[i].type,
            'type': data[i].name,
            'vendor': data[i].vendor,
            'size': data[i].size

        })
    }
})


si.osInfo(function (data) {
    sysInfo.osInfo.distro = data.distro
    sysInfo.osInfo.release = data.release
    sysInfo.osInfo.codename = data.codename
    sysInfo.osInfo.kernel = data.kernel
    sysInfo.osInfo.arch = data.arch
    sysInfo.osInfo.hostname = data.hostname
    sysInfo.osInfo.fqdn = data.fqdn
})





si.memLayout(function (data) {
    sysInfo.memLayout = data
})

si.cpu(function (data) {
    sysInfo.cpu = data
})
var socket2 = dreamHost('http://192.168.196.128:3001/cameras', {
    autoConnect: true
});

function intervalFunc() {

    socket2.emit('systemOnline', systemInfo)
}

setInterval(intervalFunc, 20000);

function intervalFunc2() {
    
    si.fsSize(function (data) {
    for (var i = 0; i < data.length; i++) {
        perfmonPacket.fsSize.push({
            'fs': data[i].fs,
            'type': data[i].type,
            'size': data[i].size,
            'used': data[i].used,
            'available': data[i].available,
            'mount': data[i].mount
        })

    }

})
    si.cpuTemperature(function (data) {
        perfmonPacket['cpuTemperature'].main = data.main
    })
    si.mem(function (data) {
        perfmonPacket['mem']['total'] = data.total
        perfmonPacket['mem']['free'] = data.free
        perfmonPacket['mem']['used'] = data.used
        perfmonPacket['mem']['available'] = data.available
    })
    si.currentLoad(function (data) {
        perfmonPacket.currentLoad.cpus = []
        perfmonPacket.currentLoad.avgLoad = data.avgLoad
        perfmonPacket.currentLoad.currentLoad = data.currentLoad
        perfmonPacket.currentLoad.currentLoadUser = data.currentLoadUser
        for (var i = 0; i < data.cpus.length; i++) {
            perfmonPacket.currentLoad.cpus.push(data.cpus[i].load)
        }
    })
    socket2.emit('perfmonStats', perfmonPacket)
perfmonPacket.fsSize.length = 0
}

setInterval(intervalFunc2, 60000);

socket2.on("hi", function (data) {

})

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

function setupFirewall() {
    executeCommand(`
    sudo sysctl net.ipv4.conf.eth0.forwarding=0 &&
    sudo sysctl net.ipv4.conf.wlan0.forwarding=0 &&
    sudo sysctl net.ipv4.conf.ztr2q2q3ib.forwarding=0 &&
    sudo iptables -P INPUT ACCEPT &&
    sudo iptables -P FORWARD ACCEPT &&
    sudo iptables -P OUTPUT ACCEPT  &&
    sudo iptables -t nat -F &&
    sudo iptables -t mangle -F &&
    sudo iptables -t raw -F &&
    sudo iptables -F &&
    sudo iptables -X &&

    sudo sysctl net.ipv4.conf.eth0.forwarding=1 &&
    sudo sysctl net.ipv4.conf.wlan0.forwarding=1 &&
    sudo sysctl net.ipv4.conf.ztr2q2q3ib.forwarding=1 &&

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 554 -j DNAT --to 10.10.5.2:554 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 554 -j ACCEPT  &&
    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 80 -j DNAT --to 10.10.5.2:80 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 80 -j ACCEPT  &&
    sudo iptables -t nat -A POSTROUTING -j MASQUERADE &&

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 555 -j DNAT --to 10.10.5.3:554 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 555 -j ACCEPT  &&
    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 81 -j DNAT --to 10.10.5.3:80 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 81 -j ACCEPT  &&
    sudo iptables -t nat -A POSTROUTING -j MASQUERADE &&

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 556 -j DNAT --to 10.10.5.4:554 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 556 -j ACCEPT  &&
        sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 82 -j DNAT --to 10.10.5.4:80 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 82 -j ACCEPT  &&
    sudo iptables -t nat -A POSTROUTING -j MASQUERADE
  `)
}

setupFirewall()




function createCameraItemDB(data){
    si.diskLayout(function (data) {
    for (var i = 0; i < data.length; i++) {
        sysInfo.diskLayout.push({
            'device': data[i].device,
            'type': data[i].type,
            'type': data[i].name,
            'vendor': data[i].vendor,
            'size': data[i].size

        })
    }
})


si.osInfo(function (data) {
    sysInfo.osInfo.distro = data.distro
    sysInfo.osInfo.release = data.release
    sysInfo.osInfo.codename = data.codename
    sysInfo.osInfo.kernel = data.kernel
    sysInfo.osInfo.arch = data.arch
    sysInfo.osInfo.hostname = data.hostname
    sysInfo.osInfo.fqdn = data.fqdn
})





si.memLayout(function (data) {
    sysInfo.memLayout = data
})

si.cpu(function (data) {
    sysInfo.cpu = data
})

Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
console.log(ifname)
});

const cam = new cams({
              nodeName: data.name,
              id: data.id,
              location: {
                lat: data.location.lat,
                lng: data.location.lng,
              },
              ip: data.ip,
              numOfCams: data.numOfCams,
              systemType: data.typs,
              sysInfo: data.sysInfo,
            });

            cam.save();
}

function Startrecording() {
    child = spawn("ffmpeg", [
        "-hide_banner", "-loglevel", "panic",
        "-i", "rtsp://admin:UUnv9njxg123@10.10.5.2:554/cam/realmonitor?channel=1&subtype=0",
        "-vcodec", "copy", "-f", "segment", "-strftime", "1",
        "-segment_time", "90", "-segment_format", "mp4", "/home/pi/CrimeCamera/public/videos/cam1/%Y-%m-%d_%H-%M.mp4"
    ]);
    child.stdout.on('data', (data) => {
    });
    child.stderr.on('data', (data) => {
    });



    child2 = spawn("ffmpeg", [
        "-hide_banner", "-loglevel", "panic",
        "-i", "rtsp://admin:UUnv9njxg123@10.10.5.3:554/cam/realmonitor?channel=1&subtype=0",
        "-vcodec", "copy", "-f", "segment", "-strftime", "1",
        "-segment_time", "90", "-segment_format", "mp4", "/home/pi/CrimeCamera/public/videos/cam2/%Y-%m-%d_%H-%M.mp4"
    ]);
    child2.stdout.on('data', (data2) => {
    });
    child2.stderr.on('data', (data2) => {
    });


    child3 = spawn("ffmpeg", [
        "-hide_banner", "-loglevel", "panic",
        "-i", "rtsp://admin:UUnv9njxg123@10.10.5.4:554/cam/realmonitor?channel=1&subtype=0",
        "-vcodec", "copy", "-f", "segment", "-strftime", "1",
        "-segment_time", "90", "-segment_format", "mp4", "/home/pi/CrimeCamera/public/videos/cam3/%Y-%m-%d_%H-%M.mp4"
    ]);
    child3.stdout.on('data', (data2) => {
    });
    child3.stderr.on('data', (data2) => {
    });
}

var datestamp = "";


function sendVideoandData() {
    var y;
    var videoFiles = []
    var ffmpeg = require('fluent-ffmpeg');
    exec('ls /home/pi/CrimeCamera/public/videos/cam1', function (error, stdout, stderr) {
        if (error) {
        }
        if (!error) {

            var newStringArray = stdout.split("\n")
            //newStringArray = toString(newStringArray)
            for (y = 0; y < newStringArray.length; y++) {
                if (newStringArray[y]) {
                    //WHY IS THIS NOT RIGHT... FIX ME
                    ffmpeg.ffprobe('/mnt/drive/cam1/' + newStringArray[y], function (err, metadata) {
                        var videoandData = {
                            "fileName": newStringArray[y],
                            "metaData": metadata
                        }
                        videoFiles.push(videoandData)
                        socket2.emit("videoFileData", metadata)
                        var numOfVideos = videoFiles.length + 1
                        if (numOfVideos === newStringArray.length) {

                            socket2.emit("videoFileDataDone", 'y')

                        }

                        if (err) {}
                    });

                }




            }

        }
    })




}

function sendVideoInfo(file, camera) {
    var ffmpeg = require('fluent-ffmpeg');
    ffmpeg.ffprobe(file, function (err, metadata) {
        var sendOBJ = {
            cam: camera,
            nodeinfo: systemInfo,
            metadata: metadata

        }
        socket2.emit('videoInfo', sendOBJ)

        if (err) {
            console.log(err)
        }
    });
}
var videoFilescam1 = []
var videoFilescam2 = []
var videoFilescam3 = []
//send em
function sendVideoFiles() {

    exec('ls /home/pi/CrimeCamera/public/videos/cam1', function (error, stdout, stderr) {
        if (error) {
        }
        if (!error) {
            var newStringArray = stdout.split("\n")
            //newStringArray = toString(newStringArray)
            for (y = 0; y < newStringArray.length; y++) {
                if (newStringArray[y]) {
                     socket2.emit("videoFilesCam1", newStringArray[y])
                    videoFilescam1.push()
                }
                if (y == newStringArray.length - 1) {
                   
                    videoFilescam1.length = 0;
                    
                    
                    setTimeout(() => {
                        exec('ls /home/pi/CrimeCamera/public/videos/cam2', function (error, stdout, stderr) {
                            if (error) {
                            }
                            if (!error) {
                                var newStringArray = stdout.split("\n")
                                //newStringArray = toString(newStringArray)
                                for (y = 0; y < newStringArray.length; y++) {
                                    if (newStringArray[y]) {
                                        socket2.emit("videoFilesCam2", newStringArray[y])
                                        videoFilescam2.push(newStringArray[y])
                                    }
                                    if (y == newStringArray.length - 1) {
                                        
                                        videoFilescam2.length = 0;
                                        
                                        
                                        
                                        setTimeout(() => {
                                            exec('ls /home/pi/CrimeCamera/public/videos/cam3', function (error, stdout, stderr) {
                                                if (error) {
                                                }
                                                if (!error) {
                                                    var newStringArray = stdout.split("\n")
                                                    //newStringArray = toString(newStringArray)
                                                    for (y = 0; y < newStringArray.length; y++) {
                                                        if (newStringArray[y]) {
                                                            videoFilescam3.push(newStringArray[y])
                                                            socket2.emit("videoFilesCam3", newStringArray[y])
                                                        }
                                                        if (y == newStringArray.length - 1) {
                                                            
                                                            videoFilescam3.length = 0;
                                                        }



                                                    }

                                                }
                                            })
                                        }, 30000);

                                    }



                                }

                            }

                        })
                    }, 30000);




                }



            }

        }
    })








}


socket2.on('getVideoInfoCam1', function (data) {
    var fileURI = "/home/pi/CrimeCamera/public/videos/cam1/" + data
    sendVideoInfo(fileURI, 'camera1')


})
socket2.on('getVideoInfoCam2', function (data) {
    var fileURI = "/home/pi/CrimeCamera/public/videos/cam2/" + data
    sendVideoInfo(fileURI, 'camera2')


})
socket2.on('getVideoInfoCam3', function (data) {
    var fileURI = "/home/pi/CrimeCamera/public/videos/cam3/" + data
    sendVideoInfo(fileURI, 'camera3')


})
socket2.on('getAllvideoandData', function (data) {
    sendVideoandData()
})
socket2.on('getVideos', function (data) {
    sendVideoFiles()



})
socket2.on('status', function (data) {
    if (data === 'sendData') {
        sendData = 1

    }


})
socket2.on('recording', function (data) {
    if (data === "start") {

        Startrecording();
    }
    if (data === "stop") {

        child.kill('SIGINT');
        setTimeout(() => {
            sendVideoFiles()
        }, 2000);


    }
})




sendVideoFiles()


socketApi.io = io;
Startrecording()


module.exports = socketApi;