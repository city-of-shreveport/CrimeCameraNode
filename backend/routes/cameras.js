//
const express = require("express")
const vids = require("../models/videos") 
const cams = require("../models/cameras")// new
const router = express.Router()
var moment = require('moment-timezone');
router.get("/haha", async (req, res) => {
    
    console.log("HAHA:")
	res.end("HAHAHA")
})
// Get all posts

router.get("/oldestVideo", async (req,res) =>{
var days = []
    vids.find({}).exec(function(err, docs) { 
        for(var i=0;i<docs.length;i++){
            var day = moment(docs[i].dateTime).format("MM-DD-YYYY")
            var weekDay = moment(docs[i].dateTime).format("Do")
            days.push(weekDay);
           
        }
        
        res.send(days ); 
    
    
    
    });






})
router.get("/videoDatesbyNode/:nodeName", async (req, res) => {
    const nodeName = req.params.nodeName
      vids.find({node:nodeName}, {DateTime:true,_id:false}, function (err, docs) { 
        if (err){ 
            console.log(err); 
        } 
        else{ 
            for(i=0;i<docs.length;i++){
                console.log(moment(docs[i].DateTime).tz("America/New_York").format("M/D/YYYY HH:mm"))

            }
            res.send(docs)
        } 
      });
   
      //
})
router.get("/videosByNode/:nodeName", async (req, res) => {
  
    const nodeName = req.params.nodeName
   
    


    

      vids.find({node:nodeName}, function (err, docs) { 
        if (err){ 
            console.log(err); 
        } 
        else{ 
            res.send(docs)
        } 
      });
   
      //
})
router.get("/getCameraInfo/:node", async (req, res) => {
    const node = req.params.node
    cams.find({nodeName:node}, function (err, docs) { 
        if (err){ 
            console.log(err); 
        } 
        else{ 
          
            res.send(docs)
        } 
      });

})
router.get("/getIP/:node", async (req, res) => {
    const node = req.params.node
    cams.find({nodeName:node}, function (err, docs) { 
        if (err){ 
            console.log(err); 
        } 
        else{ 
          
            res.send(docs)
        } 
      });

})
router.get("/videosByDay/:date/:node", async (req, res) => {
    var documents = {
        'cam1':[],
        'cam2':[],
        'cam3':[]

    }
    const date = req.params.date
    const node = req.params.node
    vids.find({node:node,DateTime: {
        $gte: new Date(date + "T00:01:00.000Z"),
        $lte: new Date(date +"T23:55:00.000Z")
      }}).sort([['DateTime', 1]]).exec(function(err, docs) { 
          
    if (err){ 
        console.log(err); 
    } 
    else{ 
        for(var i=0;i<docs.length;i++){
            switch (docs[i].camera) {
                case 'camera2':
                    documents.cam2.push(docs[i])
                break;
                case 'camera3':
                    documents.cam3.push(docs[i])
                break;
                      
                default:
                    documents.cam1.push(docs[i])
                break;
            }

           


        }
        res.send(documents)
    } 
 });
    



})
router.get("/videos/:startDate/:endDate/:nodeID", async (req, res) => {
    const startDate = req.params.startDate
    const nodeID = req.params.nodeID
    console.log(startDate)
    
    var splitFileString = startDate.split("_")
    var fileData = splitFileString[0]
    var fileTimewithExtention = splitFileString[1]
    var fileTimesplit = fileTimewithExtention.split('.')
    var fileTime = fileTimesplit[0]
    var fileTimeCelaned = fileTime.split('-')
    var dateTime = fileData + " " + fileTimeCelaned[0] +':'+fileTimeCelaned[1] +":00"
    var dateTimeString = moment(dateTime).toISOString()


    const endDate = req.params.endDate
    var splitFileString2 = endDate.split("_")
    var fileData2 = splitFileString2[0]
    var fileTimewithExtention2 = splitFileString2[1]
    var fileTimesplit2 = fileTimewithExtention2.split('.')
    var fileTime2 = fileTimesplit2[0]
    var fileTimeCelaned2 = fileTime2.split('-')
    var dateTime2 = fileData2 + " " + fileTimeCelaned2[0] +':'+fileTimeCelaned2[1] +":00"
    
    var dateTimeString2 = moment(dateTime2)
    var time = moment.duration("00:04:00");
var dateTimeString2Cleaned = dateTimeString2.subtract(time).toISOString()

  
    console.log(endDate)
console.log(dateTimeString)
console.log(dateTimeString2Cleaned)
      vids.find({nodeID:nodeID,DateTime: {
        $gte: dateTimeString,
        $lte: dateTimeString2Cleaned
      }}, function (err, docs) { 
        if (err){ 
            console.log(err); 
        } 
        else{ 
            res.send(docs)
        } 
      });
   
      //
})
const socketConn = require("socket.io-client");
var camera1 = socketConn('http://192.168.196.113:3000', { autoConnect: true});

router.get("/cameraDirecetionactions/:direction/:speed", async (req, res) => {

    camera1.emit('cameraDirecetionSpeed',req.params.speed)
	camera1.emit('cameraDirecetionActions',req.params.direction)
	res.send('ok')
})
router.get("/cameraPresets/:preset", async (req, res) => {
    camera1.emit('cameraPreset',req.params.preset)
	res.send('ok')
})
router.get("/currentcameraList", async (req, res) => {
    
	cams.find({}, function (err, docs) { 
        if (err){ 
            console.log(err); 
        } 
        else{ 
            var documents = []
          for(i=0;i<docs.length;i++){
            console.log(docs[i].lastCheckIn)
            let hours = moment().diff(moment(docs[i].lastCheckIn), 'hours', true);
            hours = hours.toFixed(2)
            if(hours<.3){
                documents.push(docs[i])


            }
          }
            res.send(documents)
        } 
      });
})
router.get("/cameraList", async (req, res) => {
    
	cams.find({}, function (err, docs) { 
        if (err){ 
            console.log(err); 
        } 
        else{ 
          
            res.send(docs)
        } 
      });
})

router.post("/addVideos", async (req, res) => {
	const vid = new vids({
        node:req.body.node,
        nodeID:req.body.nodeID,
        fileLocation:req.body.filename,
        location: {lat: req.body.location.lat, lng: req.body.location.lng},
        start_pts:req.body.start_pts,
        start_time:req.body.start_time,
        duration:req.body.duration,
        bit_rate:req.body.bit_rate,
        height:req.body.height,
        width:req.body.width,
        size:req.body.size,
        DateTime: body.dateTime
	})
	await vid.save()
	res.send(vid)
})
module.exports = router