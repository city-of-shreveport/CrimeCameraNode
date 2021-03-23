var socket_io = require('socket.io');
var moment = require('moment')
var io = socket_io();
var socketApi = {};
socketApi.io = io;
const dreamHost = require("socket.io-client");
const si = require('systeminformation');
//
var sendData = 0;
var panspeed = 4;

const {JSDOM} = require("jsdom");
const {window} = new JSDOM("");
const $ = require("jquery")(window);
var request = require('request');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn,
child = null;
var d = require('diskinfo');
var driveMounted
var sysInfo = {'diskLayout':[],
'fsSize':[],
'osInfo':{},



}
var systemInfo = {
    "name":"CrimeCamera001",
    'id': 'biasfbbvias',
    "ip":"192.168.196.89",
    "numOfCams":1,
    "typs":"PTZ",
    'sysInfo':sysInfo,
      'location':{'lat': 38.85456, 'lng':  -77.735076},



}
var perfmonPacket = {
camera:'CrimeCamera001',
'currentLoad':{
    'cpus':[]},
  'mem':{},
    'cpuTemperature':{},
   
}

si.diskLayout(function(data) {
    for(var i=0;i<data.length;i++){
        sysInfo.diskLayout.push({
        'device':data[i].device,
        'type':data[i].type,
        'type':data[i].name,
        'vendor':data[i].vendor,
        'size':data[i].size

        })
    }
  })
si.fsSize(function(data) {
    for(var i=0;i<data.length;i++){
        sysInfo.fsSize.push({
            'fs':data[i].fs,
            'type':data[i].type,
            'size': data[i].size,
            'used': data[i].used,
            'available': data[i].available,
            'mount': data[i].mount
        })
        
    }
    
  })

si.osInfo(function(data) {
    sysInfo.osInfo.distro = data.distro
    sysInfo.osInfo.release = data.release
    sysInfo.osInfo.codename = data.codename
    sysInfo.osInfo.kernel = data.kernel
    sysInfo.osInfo.arch = data.arch
    sysInfo.osInfo.hostname = data.hostname
    sysInfo.osInfo.fqdn = data.fqdn
})

  



si.memLayout(function(data) {
    sysInfo.memLayout = data
    console.log('Memory Available:');
    console.log(data[0].size);
  })

si.cpu(function(data) {
    console.log('CPU Information:');
    sysInfo.cpu = data
    console.log(data.speed)
    console.log(data.cores)
    console.log(data.brand);
  })

// promises style - new since version 3



function checkDriveMounting(){
    const { spawn } = require("child_process");
    d.getDrives(function(err, aDrives) {
        for (var i = 0; i < aDrives.length; i++) {
            if(aDrives[i].filesystem==="/dev/sda1"){
                driveMounted = 1;
          }
          else{
              driveMounted = 0;}
          }
    });
    if(driveMounted === 1){

    }
    else{
      //
        const ls = spawn("mount", ["/dev/sda1", "/home/pi/CrimeCamera/public/videos/"]);
        ls.stdout.on("data", data => {
            driveMounted = 1;
        });
        ls.stderr.on("data", data => {
            //console.log(`stderr: ${data}`);
            driveMounted = 0;
        });
        ls.on('error', (error) => {
            console.log(`error: ${error.message}`);
        });
        ls.on("close", code => {
            //console.log(`child process exited with code ${code}`);
        });         
    }
}


function Startrecording(){

    var currentDateTime = moment().format("YYYY-MM-DD_HH-mm")
       child = spawn("ffmpeg", [
          "-hide_banner","-loglevel", "panic",
          "-i", "rtsp://admin:UUnv9njxg123@10.10.5.2:554/cam/realmonitor?channel=1&subtype=0",
           "-vcodec",  "copy",  "-f", "segment", "-strftime", "1", 
           "-segment_time", "600", "-segment_format", "mp4", "/home/pi/CrimeCamera/public/videos/cam1/%Y-%m-%d_%H-%M.mp4"
      ]);
      child.stdout.on('data', (data) => {
        //sendVideoFiles()
        console.log(`stdout: ${data}`);
    });
    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
  }



var socket2 = dreamHost('http://192.168.196.123:3001/cameras', { autoConnect: true});

function intervalFunc() {
    
    socket2.emit('systemOnline',systemInfo)
  }
  
  setInterval(intervalFunc, 10000);
 
  function intervalFunc2() {
    si.cpuTemperature(function(data) {
        perfmonPacket['cpuTemperature'].main = data.main
      })
    si.mem(function(data) {
        perfmonPacket['mem']['total']=data.total
        perfmonPacket['mem']['free']=data.free
        perfmonPacket['mem']['used']=data.used
        perfmonPacket['mem']['available']=data.available
      })
    si.currentLoad(function(data) {
        perfmonPacket.currentLoad.cpus = []
        perfmonPacket.currentLoad.avgLoad=data.avgLoad
        perfmonPacket.currentLoad.currentLoad=data.currentLoad
        perfmonPacket.currentLoad.currentLoadUser=data.currentLoadUser
        for(var i=0;i<data.cpus.length;i++){
            console.log(data.cpus[i].load);
            perfmonPacket.currentLoad.cpus.push(data.cpus[i].load)  
        }
      })
    socket2.emit('perfmonStats',perfmonPacket)
    
  }
  
  setInterval(intervalFunc2, 30000);   
socket2.on("hi", function(data){
    console.log("HHHHIII")
   
})
function sendVideoandData() {
    var y;
    var videoFiles = []
    var ffmpeg = require('fluent-ffmpeg');
    exec('ls /home/pi/CrimeCamera/public/videos/cam1' , function(error, stdout, stderr) {
      if (error){
        console.log(error)
      }
      if (!error){
          var newStringArray = stdout.split("\n")
          console.log("number of videos:  " + newStringArray.length)
          //newStringArray = toString(newStringArray)
            //console.log(newStringArray.length)
            for(y=0;y<newStringArray.length;y++){
                if(newStringArray[y]){
                    //console.log(newStringArray[y])
                    ffmpeg.ffprobe('/home/pi/CrimeCamera/public/videos/cam1/'+newStringArray[y],function(err, metadata) {
                        //console.log(metadata);
                        var videoandData = {"fileName":newStringArray[y],"metaData":metadata}
                        videoFiles.push(videoandData)
                        socket2.emit("videoFileData",metadata )
                        //console.log(videoFiles.length + " : " + newStringArray.length)
                        var numOfVideos = videoFiles.length + 1
                        if(numOfVideos===newStringArray.length){
                            console.log("done")
                            socket2.emit("videoFileDataDone",'y' )
                        } 
                        if(err){}
                    }); 
                    
                }
            }
      }
    })
}
function sendVideoInfo(file){
    var ffmpeg = require('fluent-ffmpeg');
        ffmpeg.ffprobe(file,function(err, metadata) {
            
        var sendOBJ = {
            nodeinfo: systemInfo,
            metadata:metadata

           }
            console.log(sendOBJ);
            socket2.emit('videoInfo', sendOBJ)
            if(err){console.log(err)}
        }); 
    }
function sendVideoFiles(){
    var videoFiles = []
    console.log("Sending Videos")
    exec('ls /home/pi/CrimeCamera/public/videos/cam1' , function(error, stdout, stderr) {
      if (error){
        console.log(error)
      }
      if (!error){
          var newStringArray = stdout.split("\n")
          //newStringArray = toString(newStringArray)
            //console.log(newStringArray.length)
            for(y=0;y<newStringArray.length;y++){
                if(newStringArray[y]){
                    //console.log(newStringArray[y])
                    videoFiles.push(newStringArray[y])
                    //console.log(videoFiles)
                }
                if(y == newStringArray.length - 1){
                    socket2.emit("videoFile",videoFiles )
                    videoFiles.length = 0;
                }
            }
      }
    })
} 

Startrecording();
   
    socket2.on('status', function(data){
        if(data==='sendData'){
            sendData = 1
        }
    })
    socket2.on('getVideoInfo', function(data){
        var fileURI = "/home/pi/CrimeCamera/public/videos/cam1/"+data
        sendVideoInfo(fileURI)
    })
    socket2.on('recording', function(data) {
        //console.log(data)
        if(data==="start"){
            Startrecording();
        }
        if(data==="stop"){
            child.kill('SIGINT');
            setTimeout(() => {
                sendVideoFiles()
            }, 90000);
        }
      })
      socket2.on('panSpeed', function(data) {
            panspeed = data
      })
      socket2.on('Cameraaction', function(data) {
        switch (data) {
            case 'up':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=Up&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    })
                    .done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        //console.log(errorThrown)
                    })
                break;
            case 'upStop':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=stop&channel=0&code=Up&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'down':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=Down&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'downStop':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=stop&channel=0&code=Down&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'left':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=Left&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'leftStop':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=stop&channel=0&code=Left&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",

                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'right':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=Right&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'rightStop':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=stop&channel=0&code=Right&arg1=0&arg2='+ panspeed +'&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'pos1':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=1&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'pos2':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=2&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'pos3':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=3&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'pos4':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=4&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'pos5':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=5&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
                case 'pos6':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=6&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
                case 'pos7':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=7&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
                case 'pos8':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=8&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
                case 'pos9':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=9&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'startTour':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=StartTour&arg1=1&arg2=0&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'zoomIN':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=ZoomTele&arg1=1&arg2=0&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'zoomOUT':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=ZoomWide&arg1=1&arg2=0&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'zoomINStop':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=stop&channel=0&code=ZoomTele&arg1=1&arg2=0&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'zoomOUTStop':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=stop&channel=0&code=ZoomWide&arg1=1&arg2=0&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'scanON':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=AutoScanOn&arg1=1&arg2=0&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
            case 'scanOff':
                $.ajax({
                        type: 'GET',
                        url: 'http://10.10.5.2/cgi-bin/ptz.cgi?action=start&channel=0&code=AutoScanOff&arg1=1&arg2=0&arg3=0',
                        username: "admin",
                        password: "UUnv9njxg123",
                    }).done(function(data, textStatus, jqXHR) {
                        // Process data, as received in data parameter
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown)
                    })
                break;
        }
    })
socket2.on('getVideos', function(data){
    sendVideoFiles()
})
checkDriveMounting();



module.exports = socketApi;