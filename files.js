var chokidar = require('chokidar');
var watcher = chokidar.watch('/home/pi/CrimeCamera/public/videos/cam3', {ignored: /^\./, persistent: true});
const vids = require('./models/videos');
var addedFIles = []
const fs = require("fs")
const glob = require('glob')
const mongoose = require('mongoose');
 var ffmpeg = require('fluent-ffmpeg');
 const moment = require('moment')
 var videoFilescam1 = []
 var videoFilescam2 = []
 var videoFilescam3 = []
mongoose.connect('mongodb://localhost/cameras', function (err) {
  if (err) throw err;
  console.log('Successfully connected');

const newestFile = glob.sync('/home/pi/CrimeCamera/public/videos/cam3/*mp4')
  .map(name => ({name, ctime: fs.statSync(name).ctime}))
  .sort((a, b) => b.ctime - a.ctime)[1].name
//checkVidInDB(newestFile)
  //console.log(newestFile)
const {
exec
} = require("child_process");
  

const sleep = (time) => {
  return new Promise(resolve => setTimeout(resolve, time))
}

function checkVidInDB(path){
    vids.exists(
        {
          fileLocation: path,
        },
        function (err, doc) {
          if (err) {console.log(err)
          } else { console.log(doc)
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
                            var dateTimeString = moment(dateTime).toISOString();
                           
                            const vid = new vids({
                              camera: 'data.cam',
                              node: 'data.nodeinfo.name',
                              nodeID: 'data.nodeinfo.id',
                              fileLocation: metadata.format.filename,
                              location: {
                                lat: 00000,
                                lng: 00000,
                              },
                              start_pts: metadata.format.start_pts,
                              start_time: metadata.format.start_time,
                              duration: metadata.format.duration,
                              bit_rate: metadata.format.bit_rate,
                              height: metadata.streams[0].height,
                              width: metadata.streams[0].width,
                              size: metadata.format.size,
                              DateTime: dateTimeString,
                            });
                            vid.save();
                          
                              } catch (error) { 
                             
                           }

                      if (err) {
                         
                      }
                  });
                  } catch (error) {
                    
                  }
              }
          }
        }
      );




}





const updateCam1 = async () => {
  for (let i = 0; i < videoFilescam1.length; i++) {
    await sleep(50)
    checkVidInDB(videoFilescam1[i])
    if(i == videoFilescam1.length){
      console.log("camera 1 is done updating")


    }
  }


}

const updateCam2 = async () => {
  for (let i = 0; i < videoFilescam2.length; i++) {
    await sleep(50)
    checkVidInDB(videoFilescam2[i])
    if(i==videoFilescam2.length){
      console.log("camera 2 is done updating")


    }
  }


}
const updateCam3 = async () => {
  for (let i = 0; i < videoFilescam3.length; i++) {
    await sleep(50)
    checkVidInDB(videoFilescam3[i])
    if(i == videoFilescam3.length){
      console.log("camera 3 is done updating")


    }
  }


}

    exec('ls /home/pi/CrimeCamera/public/videos/cam1', function (error, stdout, stderr) {
        if (error) {
        }
        if (!error) {
          videoFilescam1.length = 0
            var newStringArray = stdout.split("\n")
            //newStringArray = toString(newStringArray)
            for (y = 0; y < newStringArray.length; y++) {
                if (newStringArray[y]) {
                    videoFilescam1.push("/home/pi/CrimeCamera/public/videos/cam1/" + newStringArray[y])
                   
                    ///checkVidInDB(videoPath)
                }
                if (y == newStringArray.length - 1) {
                  updateCam1()
                   setTimeout(() => {
                     exec('ls /home/pi/CrimeCamera/public/videos/cam2', function (error, stdout, stderr) {
                          if (error) {
                          }
                          if (!error) {
                            videoFilescam2.length = 0
                              var newStringArray = stdout.split("\n")
                              //newStringArray = toString(newStringArray)
                              for (y = 0; y < newStringArray.length; y++) {
                                  if (newStringArray[y]) {
                                      videoFilescam2.push("/home/pi/CrimeCamera/public/videos/cam2/" + newStringArray[y])
                                    
                                      ///checkVidInDB(videoPath)
                                  }
                                  if (y == newStringArray.length - 1) {
                                    updateCam2()
                                    setTimeout(() => {
                                      exec('ls /home/pi/CrimeCamera/public/videos/cam3', function (error, stdout, stderr) {
                                            if (error) {
                                            }
                                            if (!error) {
                                              videoFilescam3.length = 0
                                                var newStringArray = stdout.split("\n")
                                                //newStringArray = toString(newStringArray)
                                                for (y = 0; y < newStringArray.length; y++) {
                                                    if (newStringArray[y]) {
                                                        videoFilescam3.push("/home/pi/CrimeCamera/public/videos/cam3/" + newStringArray[y])
                                                      
                                                        ///checkVidInDB(videoPath)
                                                    }
                                                    if (y == newStringArray.length - 1) {
                                                      updateCam3()
                                                      

                                                    }
                                                }
                                            }
                                        })
                                    }, 2000);

                                  }
                              }
                          }
                      })
                   }, 2000);

                }
            }
        }
    })







});