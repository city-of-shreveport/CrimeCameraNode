var socket_io = require('socket.io');
<<<<<<< HEAD
var io = socket_io();
var socketApi = {};
const dreamHost = require("socket.io-client");
var os = require('os');
var ifaces = os.networkInterfaces();
const si = require('systeminformation');
const { exec } = require("child_process");

require('events').EventEmitter.prototype._maxListeners = 100;

const {
    JSDOM
} = require("jsdom");
const {
    window
} = new JSDOM("");
const $ = require("jquery")(window);

var request = require('request');

request.post(
    'http://10.10.10.3/?json=true',
    { json: { machineID: "fMUVxYdG1X3hWb7GNkTd", mail: "talk2dug@gmail.com", pass: "UUnv9njxg123", function: "dash"} },
    function (error, response, d) {
        if (!error && response.statusCode == 200) {
            console.log(d.$user);
        }
    }
);

// "calibrated" occurs once, at the beginning of a session,

var panspeed = 4;


var sendData = 0;

var moment = require("moment")
var fileNameTImeStamp = moment().format("YYYY-MM-DD-HHmm");
      var name = "/mnt/drive/"+ fileNameTImeStamp+".mp4"
var spawn = require('child_process').spawn,
child = null;
=======
<<<<<<< HEAD
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
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
var sysInfo = {'diskLayout':[],
'fsSize':[],
'osInfo':{},



}
<<<<<<< HEAD
var systemInfo

=======
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d

var perfmonPacket = {
camera:sysInfo.osInfo.hostname,
'currentLoad':{
    'cpus':[]},
  'mem':{},
    'cpuTemperature':{},
   
}


<<<<<<< HEAD
var socket2 = dreamHost('http://192.168.196.123:3001/cameras', { autoConnect: true});
=======

// promises style - new since version 3
var systemInfo


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
        const ls = spawn("mount", ["/dev/sda1", "/home/pi/CrimeCamera/ptz/public/videos/"]);
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
           "-segment_time", "600", "-segment_format", "mp4", "/home/pi/CrimeCamera/ptz/public/videos/cam1/%Y-%m-%d_%H-%M.mp4"
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

>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
function intervalFunc() {
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
      systemInfo = {
        "name":sysInfo.osInfo.hostname,
<<<<<<< HEAD
        'id': 'jhgwesd',
        "ip":"192.168.196.164",
        "numOfCams":3,
        "typs":"standard",
        'sysInfo':sysInfo,
          'location':{'lat': 38.65456, 'lng':  -77.435076},
=======
        'id': 'biasfbbvias',
        "ip":"192.168.196.89",
        "numOfCams":1,
        "typs":"PTZ",
        'sysInfo':sysInfo,
          'location':{'lat': 38.85456, 'lng':  -77.735076},
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
    
    
    
    }
    socket2.emit('systemOnline',systemInfo)
  }
  
<<<<<<< HEAD
  setInterval(intervalFunc, 20000);
=======
  setInterval(intervalFunc, 10000);
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
 
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
<<<<<<< HEAD
    
=======
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
socket2.on("hi", function(data){
    console.log("HHHHIII")
   
})
<<<<<<< HEAD

function executeCommand(command) {
  exec(command, (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
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
    sudo iptables -t nat -A POSTROUTING -j MASQUERADE &&

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 555 -j DNAT --to 10.10.5.3:554 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 555 -j ACCEPT  &&
    sudo iptables -t nat -A POSTROUTING -j MASQUERADE &&

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d 192.168.196.164 --dport 556 -j DNAT --to 10.10.5.4:554 &&
    sudo iptables -A FORWARD -p tcp -d 192.168.196.164 --dport 556 -j ACCEPT  &&
    sudo iptables -t nat -A POSTROUTING -j MASQUERADE
  `)
}




var d = require('diskinfo');
var driveMounted

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
        const ls = spawn("mount", ["/dev/sda1", "/home/pi/CrimeCamera/multi/public/videos/"]);
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
setupFirewall()
checkDriveMounting()

function Startrecording(){
       child = spawn("ffmpeg", [
          "-hide_banner","-loglevel", "panic",
          "-i", "rtsp://admin:UUnv9njxg123@10.10.5.2:554/cam/realmonitor?channel=1&subtype=0",
           "-vcodec",  "copy",  "-f", "segment", "-strftime", "1", 
           "-segment_time", "600", "-segment_format", "mp4", "/home/pi/CrimeCamera/multi/public/videos/cam1/%Y-%m-%d_%H-%M.mp4"
      ]);
      child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });



       child2 = spawn("ffmpeg", [
          "-hide_banner","-loglevel", "panic",
          "-i", "rtsp://admin:UUnv9njxg123@10.11.5.2:554/cam/realmonitor?channel=1&subtype=0",
           "-vcodec",  "copy",  "-f", "segment", "-strftime", "1", 
           "-segment_time", "600", "-segment_format", "mp4", "/home/pi/CrimeCamera/multi/public/videos/cam2/%Y-%m-%d_%H-%M.mp4"
      ]);
      child2.stdout.on('data', (data2) => {
        console.log(`stdout: ${data2}`);
    });
    child2.stderr.on('data', (data2) => {
        console.log(`stderr: ${data2}`);
    });


    child3 = spawn("ffmpeg", [
        "-hide_banner","-loglevel", "panic",
        "-i", "rtsp://admin:UUnv9njxg123@10.12.5.2:554/cam/realmonitor?channel=1&subtype=0",
         "-vcodec",  "copy",  "-f", "segment", "-strftime", "1", 
         "-segment_time", "600", "-segment_format", "mp4", "/home/pi/CrimeCamera/multi/public/videos/cam3/%Y-%m-%d_%H-%M.mp4"
    ]);
    child3.stdout.on('data', (data2) => {
      console.log(`stdout: ${data2}`);
  });
  child3.stderr.on('data', (data2) => {
      console.log(`stderr: ${data2}`);
  });
  }

    var datestamp = "";
    Object.keys(ifaces).forEach(function(ifname) {
        var alias = 0;

    });

=======
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
function sendVideoandData() {
    var y;
    var videoFiles = []
    var ffmpeg = require('fluent-ffmpeg');
<<<<<<< HEAD
    exec('ls /home/pi/CrimeCamera/multi/public/videos/cam1' , function(error, stdout, stderr) {
=======
    exec('ls /home/pi/CrimeCamera/ptz/public/videos/cam1' , function(error, stdout, stderr) {
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
      if (error){
        console.log(error)
      }
      if (!error){
<<<<<<< HEAD
          
          var newStringArray = stdout.split("\n")
          console.log("number of videos:  " + newStringArray.length)
          //newStringArray = toString(newStringArray)
            console.log(newStringArray.length)
            for(y=0;y<newStringArray.length;y++){
                if(newStringArray[y]){
                    console.log(newStringArray[y])
                    //WHY IS THIS NOT RIGHT... FIX ME
                    ffmpeg.ffprobe('/mnt/drive/cam1/'+newStringArray[y],function(err, metadata) {
=======
          var newStringArray = stdout.split("\n")
          console.log("number of videos:  " + newStringArray.length)
          //newStringArray = toString(newStringArray)
            //console.log(newStringArray.length)
            for(y=0;y<newStringArray.length;y++){
                if(newStringArray[y]){
                    //console.log(newStringArray[y])
                    ffmpeg.ffprobe('/home/pi/CrimeCamera/ptz/public/videos/cam1/'+newStringArray[y],function(err, metadata) {
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
                        //console.log(metadata);
                        var videoandData = {"fileName":newStringArray[y],"metaData":metadata}
                        videoFiles.push(videoandData)
                        socket2.emit("videoFileData",metadata )
<<<<<<< HEAD
                        console.log(videoFiles.length + " : " + newStringArray.length)
                        var numOfVideos = videoFiles.length + 1
                        if(numOfVideos===newStringArray.length){
                            console.log("done")
                            
                            socket2.emit("videoFileDataDone",'y' )
                            
                        } 
                        
=======
                        //console.log(videoFiles.length + " : " + newStringArray.length)
                        var numOfVideos = videoFiles.length + 1
                        if(numOfVideos===newStringArray.length){
                            console.log("done")
                            socket2.emit("videoFileDataDone",'y' )
                        } 
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
                        if(err){}
                    }); 
                    
                }
<<<<<<< HEAD
                
                 
                   

            }
  
      }
    })

   
    

}
function sendVideoInfo(file, camera){
    console.log("Getting metaData")
    console.log(file)
    var ffmpeg = require('fluent-ffmpeg');
        ffmpeg.ffprobe(file,function(err, metadata) {
         
            var sendOBJ = {
                cam:camera,
                nodeinfo: systemInfo,
                metadata:metadata
    
               }
               //console.log(sendOBJ)
            socket2.emit('videoInfo', sendOBJ)
       
            if(err){console.log(err)}
        }); 
    }
    var videoFilescam1 = []
    var videoFilescam2 = []
    var videoFilescam3 = []
    //send em
function sendVideoFiles(){
   
    exec('ls /home/pi/CrimeCamera/multi/public/videos/cam1' , function(error, stdout, stderr) {
=======
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
    exec('ls /home/pi/CrimeCamera/ptz/public/videos/cam1' , function(error, stdout, stderr) {
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
      if (error){
        console.log(error)
      }
      if (!error){
          var newStringArray = stdout.split("\n")
          //newStringArray = toString(newStringArray)
<<<<<<< HEAD
            //console.log(newStringArray)
            for(y=0;y<newStringArray.length;y++){
                if(newStringArray[y]){
                    //console.log(newStringArray[y])
                    videoFilescam1.push(newStringArray[y])
                }
                if(y == newStringArray.length - 1){
                    socket2.emit("videoFilesCam1",videoFilescam1 )
                     videoFilescam1.length = 0;
                     setTimeout(() => {
                        exec('ls /home/pi/CrimeCamera/multi/public/videos/cam2' , function(error, stdout, stderr) {
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
                                          videoFilescam2.push(newStringArray[y])
                                      }
                                      if(y == newStringArray.length - 1){
                                          socket2.emit("videoFilesCam2",videoFilescam2 )
                                          videoFilescam2.length = 0;
                                          setTimeout(() => {
                                            exec('ls /home/pi/CrimeCamera/multi/public/videos/cam3' , function(error, stdout, stderr) {
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
                                                              videoFilescam3.push(newStringArray[y])
                                                          }
                                                          if(y == newStringArray.length - 1){
                                                              socket2.emit("videoFilesCam3",videoFilescam3 )
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


socket2.on('getVideoInfoCam1', function(data){
    var fileURI = "/home/pi/CrimeCamera/multi/public/videos/cam1/"+data
    sendVideoInfo(fileURI, 'camera1')
//console.log(fileURI)


})
socket2.on('getVideoInfoCam2', function(data){
    var fileURI = "/home/pi/CrimeCamera/multi/public/videos/cam2/"+data
    sendVideoInfo(fileURI, 'camera2')
    //console.log(fileURI)


})
socket2.on('getVideoInfoCam3', function(data){
    var fileURI = "/home/pi/CrimeCamera/multi/public/videos/cam3/"+data
    sendVideoInfo(fileURI, 'camera3')
    //console.log(fileURI)


})
socket2.on('getAllvideoandData', function(data){
    //console.log(data)
    sendVideoandData()
})
socket2.on('getVideos', function(data){
        sendVideoFiles()



    })
    socket2.on('status', function(data){
        if(data==='sendData'){
            sendData = 1

        }
        //console.log(data)


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
            }, 2000);
          

        }
      })
      Startrecording();
      sendVideoFiles()
socketApi.io = io;
Startrecording()
=======
            //console.log(newStringArray.length)
            for(y=0;y<newStringArray.length;y++){
                if(newStringArray[y]){
                    //console.log(newStringArray[y])
                    videoFiles.push(newStringArray[y])
                    //console.log(videoFiles)
                }
                if(y == newStringArray.length - 1){
                    socket2.emit("videoFiles",videoFiles )
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
    socket2.on('getVideoInfoCam1', function(data){
        console.log("get Video Info")
        var fileURI = "/home/pi/CrimeCamera/ptz/public/videos/cam1/"+data
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



=======
var io = socket_io();
var socketApi = {};
socketApi.io = io;
var moment = require('moment')
var cameraNodes = io.of('/cameras');
const vids = require("./models/videos")
const cams = require("./models/cameras")
const perfmon = require("./models/perfmon")
const mongoose = require("mongoose")
var spawn = require('child_process').spawn,
child1 = null,
child2 = null,
child3 = null;


child1 = spawn("ffmpeg", [
  "-hide_banner","-loglevel", "panic",
  "-fflags", "nobuffer" ,
 "-rtsp_transport", "tcp", 
 "-i", "rtsp://admin:UUnv9njxg123@192.168.196.164:554/cam/realmonitor?channel=1&subtype=0", 
 "-vsync", "0", 
 "-copyts", 
 "-vcodec", "copy", 
 "-movflags", "frag_keyframe+empty_moov" ,
 "-an", 
 "-hls_flags", "delete_segments+append_list", 
 "-f", "segment",
 "-segment_list_flags", "live",
 "-segment_time", "10",
 "-segment_list_size", "3",
 "-segment_format", "mpegts",
 "-segment_list", "/home/spd/CrimeCamera/backend/public/liveStream/cam1/index.m3u8",
 "-segment_list_type", "m3u8",
 "-segment_list_entry_prefix", "",
 "-segment_wrap", "100",
 "public/liveStream/cam1/%d.ts"

]);
child2 = spawn("ffmpeg", [
  "-hide_banner","-loglevel", "panic",
  "-fflags", "nobuffer" ,
 "-rtsp_transport", "tcp", 
 "-i", "rtsp://admin:UUnv9njxg123@192.168.196.164:555/cam/realmonitor?channel=1&subtype=0", 
 "-vsync", "0", 
 "-copyts", 
 "-vcodec", "copy", 
 "-movflags", "frag_keyframe+empty_moov" ,
 "-an", 
 "-hls_flags", "delete_segments+append_list", 
 "-f", "segment",
 "-segment_list_flags", "live",
 "-segment_time", "10",
 "-segment_list_size", "3",
 "-segment_format", "mpegts",
 "-segment_list", "/home/spd/CrimeCamera/backend/public/liveStream/cam2/index2.m3u8",
 "-segment_list_type", "m3u8",
 "-segment_list_entry_prefix", "",
 "-segment_wrap", "100",
 "public/liveStream/cam2/2%d.ts"

]);
child3 = spawn("ffmpeg", [
  "-hide_banner","-loglevel", "panic",
  "-fflags", "nobuffer" ,
 "-rtsp_transport", "tcp", 
 "-i", "rtsp://admin:UUnv9njxg123@192.168.196.164:556/cam/realmonitor?channel=1&subtype=0", 
 "-vsync", "0", 
 "-copyts", 
 "-vcodec", "copy", 
 "-movflags", "frag_keyframe+empty_moov" ,
 "-an", 
 "-hls_flags", "delete_segments+append_list", 
 "-f", "segment",
 "-segment_list_flags", "live",
 "-segment_time", "10",
 "-segment_list_size", "3",
 "-segment_format", "mpegts",
 "-segment_list", "/home/spd/CrimeCamera/backend/public/liveStream/cam3/index3.m3u8",
 "-segment_list_type", "m3u8",
 "-segment_list_entry_prefix", "",
 "-segment_wrap", "100",
 "public/liveStream/cam3/3%d.ts"

]);
child1.stdout.on('data', (data) => {
//console.log(`stdout: ${data}`);
});
child1.stderr.on('data', (data) => {
console.log(`stderr: ${data}`);
});
child2.stdout.on('data', (data) => {
  //console.log(`stdout: ${data}`);
  });
  child2.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
  });
  child3.stdout.on('data', (data) => {
    //console.log(`stdout: ${data}`);
    });
    child3.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
    });


mongoose.connect('mongodb://localhost/cameras', function (err) {
 
   if (err) throw err;
 
   console.log('Successfully connected');
 
});
var videoswithData = []

//Just to make a change
function checkLastCheckIn(){
  var time = moment.duration("00:15:00");
  var date = moment();
  var newDateTime = date.subtract(time);
var olderThanDate = moment(newDateTime).toISOString()

cams.find({ lastCheckIn: {$lte:olderThanDate}}, function (err, docs) { 
  if (err){ 
      //console.log(err); 
  } 
  else{ 
      //console.log("OFFLINE : ", docs); 
  } 
}); 

cams.find({ lastCheckIn: {$gte:olderThanDate}}, function (err, docs) { 
  if (err){ 
      //console.log(err); 
  } 
  else{ 
      //console.log("ONLINE : ", docs); 
  } 
}); 




}
cameraNodes.on('connection', socket => {
  console.log("newconnection");
  socket.emit('hi');
  socket.on('videoFiles', function(data) {
    //console.log("videoFilesCam1:  " + data)
    for(var i=0;i<data.length;i++){
      //console.log(data[i])
      socket.emit('getVideoInfoCam1',data[i])
    }
    
  })

  socket.on('Cameraaction', function(action){
    socket.broadcast.emit('Cameraaction',action)
    console.log("CameraAction")

  })
  socket.on('videoFilesCam2', function(data) {
    //console.log("videoFilesCam2:  " + data)
    for(var i=0;i<data.length;i++){
      //console.log(data[i])
      socket.emit('getVideoInfoCam2',data[i])
    }
    
  })
  socket.on('videoFilesCam3', function(data) {
    //console.log("videoFilesCam3:  " + data)
    for(var i=0;i<data.length;i++){
      //console.log(data[i])
      socket.emit('getVideoInfoCam3',data[i])
    }
    
  })
  socket.on('videoFile', function(data) {
    //console.log("videoFile:  " + data)
    for(var i=0;i<data.length;i++){
      //console.log(data[i])
      socket.emit('getVideoInfo',data[i])
    }
    
  })

  socket.on('perfmonStats', function(data){
    //console.log(data)
    const perf = new perfmon(data)
      perf.save()

  })
  socket.on('systemOnline', function(data){
    var dateNOW = moment().toISOString()
   
    cams.exists({nodeName:data.name}, function (err, doc) { 
      if (err){ 
      
      }else{ 
          //console.log("Result :", doc) // true 
          if(doc==false){
            const cam = new cams({

              'nodeName':data.name,
              'id': data.id,
              'location':{'lat': data.location.lat, 'lng': data.location.lng},
              'ip': data.ip,
              'numOfCams': data.numOfCams,
              'systemType': data.typs,
              'lastCheckIn': dateNOW,
              'sysInfo':data.sysInfo,
              
            })
              cam.save()
              //console.log(cam)
            }

            if( doc == true){

              cams.findOneAndUpdate({nodeName: data.name },  
                {lastCheckIn:dateNOW}, null, function (err, docs) { 
                if (err){ 
                    //console.log(err) 
                } 
                else{ 
                   //console.log("Original Doc : ",docs); 
                } 
            }); 
            

            }
         
        
          
          }
    
    
    
    })
    
    
    
    
    socket.emit("getVideos")


  })
  socket.on('videoInfo', function(data){
    console.log("VideoInfo")
    console.log(data)
  
 try{
  vids.exists({fileLocation:data.metadata.format.filename}, function (err, doc) { 
    if (err){ 
      console.log(err)
    }else{ 
        //("Result :", doc) // true 

        
        if(doc==false){
          try{
            //console.log(data)
          var camera = data.cam
          var node = data.nodeinfo.name
          var nodeID = data.nodeinfo.id
          var date =  data.metadata.format.filename
          var sperateddate =  date.split('/')
          var fileString = sperateddate[8]
          console.log(fileString)
          var splitFileString = fileString.split("_")
          var fileData = splitFileString[0]
          var fileTimewithExtention = splitFileString[1]
          var fileTimesplit = fileTimewithExtention.split('.')
          var fileTime = fileTimesplit[0]
          var fileTimeCelaned = fileTime.split('-')
          var dateTime = fileData + " " + fileTimeCelaned[0] +':'+fileTimeCelaned[1] +":00"
          var dateTimeString = moment(dateTime).toISOString()
       
          //console.log(dateTimeString)
          const vid = new vids({
            camera:data.cam,
            node:data.nodeinfo.name,
            nodeID: data.nodeinfo.id,
            fileLocation: data.metadata.format.filename,
            location: {'lat': data.nodeinfo.location.lat, 'lng': data.nodeinfo.location.lng},
            start_pts:data.metadata.format.start_pts,
            start_time:data.metadata.format.start_time,
            duration:data.metadata.format.duration,
            bit_rate:data.metadata.format.bit_rate,
            height:data.metadata.streams[0].height,
            width:data.metadata.streams[0].width,
            size:data.metadata.format.size,
            DateTime: dateTimeString
        })
        vid.save()
      }catch(err){console.log(err)
      }
        ////console.log(err)



        }
    } 
}); 
  
  

 }catch(err){
  //console.log(err)

 }     
         
  })
});


socketApi.sendNotification = function() {
    io.sockets.emit('hello', {msg: 'Hello World!'});
}


function intervalFunc() {
  checkLastCheckIn()
}

setInterval(intervalFunc, 15000);
>>>>>>> d57506218ddfa586b8eebd9483c274e2ffa89596
>>>>>>> 9f7fa22caa68952ef6458144d1ca5a79922e6e8d
module.exports = socketApi;