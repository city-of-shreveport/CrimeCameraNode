var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};
socketApi.io = io;
var moment = require('moment')
var cameraNodes = io.of('/cameras');
const vids = require("./models/videos")
const cams = require("./models/cameras")
const perfmon = require("./models/perfmon")
const mongoose = require("mongoose")


mongoose.connect('mongodb://localhost/cameras', function (err) {
 
   if (err) throw err;
 
   console.log('Successfully connected');
 
});
var videoswithData = []


function checkLastCheckIn(){
  var time = moment.duration("00:15:00");
  var date = moment();
  var newDateTime = date.subtract(time);
var olderThanDate = moment(newDateTime).toISOString()

cams.find({ lastCheckIn: {$lte:olderThanDate}}, function (err, docs) { 
  if (err){ 
      console.log(err); 
  } 
  else{ 
      //console.log("OFFLINE : ", docs); 
  } 
}); 

cams.find({ lastCheckIn: {$gte:olderThanDate}}, function (err, docs) { 
  if (err){ 
      console.log(err); 
  } 
  else{ 
      //console.log("ONLINE : ", docs); 
  } 
}); 




}
cameraNodes.on('connection', socket => {
  console.log("newconnection");
  socket.emit('hi');
  socket.on('videoFilesCam1', function(data) {
    console.log("videoFilesCam1:  " + data)
    for(var i=0;i<data.length;i++){
      console.log(data[i])
      socket.emit('getVideoInfoCam1',data[i])
    }
    
  })

  socket.on('Cameraaction', function(action){
    socket.broadcast.emit('Cameraaction',action)
    console.log("CameraAction")

  })
  socket.on('videoFilesCam2', function(data) {
    console.log("videoFilesCam2:  " + data)
    for(var i=0;i<data.length;i++){
      //console.log(data[i])
      socket.emit('getVideoInfoCam2',data[i])
    }
    
  })
  socket.on('videoFilesCam3', function(data) {
    console.log("videoFilesCam3:  " + data)
    for(var i=0;i<data.length;i++){
      //console.log(data[i])
      socket.emit('getVideoInfoCam3',data[i])
    }
    
  })
  socket.on('videoFile', function(data) {
    //console.log("videoFile:  " + data)
    for(var i=0;i<data.length;i++){
      console.log(data[i])
      socket.emit('getVideoInfo',data[i])
    }
    
  })

  socket.on('perfmonStats', function(data){
    console.log(data)
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
                    console.log(err) 
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
    console.log(data.nodeinfo)
  
 try{
  vids.exists({fileLocation:data.metadata.format.filename}, function (err, doc) { 
    if (err){ 
      
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
          var fileString = sperateddate[7]
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
      }catch(err){console.log(err)}
        console.log(err)



        }
    } 
}); 
  
  

 }catch(err){
  console.log(err)

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
module.exports = socketApi;