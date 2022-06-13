const express = require('express')
const app = express()
const port = 3002
require('dotenv').config();
const si = require('systeminformation');
const fetch = require('node-fetch');
const { exec, execSync, spawn } = require('child_process');
let rsync = null;

let CurrentBuddy = {'buddy':'','ip':''}
//Get currentBuddy and its IP
fetch(`http://rtcc-server.shreveport-it.org:3000/api/nodes/`+ process.env.NODE_IDENTIFIER)
.then((response) => response.json())
.then((json) => {
  console.log(json.config.ip)
  

});

let streaming = false
let synching = false
function checkPort(port){
  exec('iptstate -D '+port+' -1', (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
  
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    var dataStringSplit = stdout.toString().split('\n');
    for(i=0;i<dataStringSplit.length;i++){
      var datacleanEachLine = dataStringSplit[i].replace(/\s+/g, " ");
      var dataSplitEachLine = datacleanEachLine.split(' ');
      if(dataSplitEachLine[1] === '10.10.30.106:'+port){
         if(dataSplitEachLine[3]==='ESTABLISHED'){
            streaming = true
          }
          else{
            streaming = false
          }
      }
      
    }
  });

}

setInterval(() => {
  checkPort(554);
  setTimeout(() => {
    checkPort(555);
  }, 250);
  setTimeout(() => {
    checkPort(556);
  }, 500);
  
}, 5000);

function getnetworkStats(){
  
    if(streaming){
      if(synching===true){
        console.log('stop rsync')
        synching = false;
        //rsync.kill('SIGINT');
      }
    }
    if(!streaming){
      if(synching===false){
        console.log('start rsync')
        synching = true;
        //rsync = require('child_process').spawn(' ');
      } 
    }
   


  
}


app.get('/', (req, res) => {
  res.send('Nothing to see here')
})
app.get('/stopBuddy', (req, res) => {
  stopBuddy()
  res.send(202)
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

setInterval(() => { getnetworkStats() }, 60000);
getnetworkStats();

// Function rsync command

// timer function wait 30 min check network stats





//Get current Buddy
//Check if online(maybe)
//Start initial rsync
//Wait for webhook 
// if get webhook stop rsyn and start 30 min timer
//After 30 min
//Check network usage
//if high restart 30 min timer
//if low restart rsync

   

 
//Loop RSYNC every hour


//rsync -avzh /home/pi/videos/camera1 pi@10.10.30.141:/home/pi/remote_backups/CrimeCamera074/caemra1/

