const express = require('express')
const app = express()
const port = 3002
require('dotenv').config();
const si = require('systeminformation');
const fetch = require('node-fetch');
const { exec, execSync, spawn } = require('child_process');
let rsync = null;
let currentip = ''
let CurrentBuddy = {'buddy':'','ip':''}
//Get currentBuddy and its IP
function getCurrentBudy(){
fetch(`http://rtcc-server.shreveport-it.org:3000/api/nodes/`+ process.env.NODE_IDENTIFIER)
.then((response) => response.json())
.then((json) => {
  currentip = json.config.ip
  console.log(json.config.currentBuddy)
  CurrentBuddy.buddy = json.config.currentBuddy
  fetch(`http://rtcc-server.shreveport-it.org:3000/api/nodes/`+ json.config.currentBuddy)
    .then((response) => response.json())
    .then((json) => {
      CurrentBuddy.ip = json.config.ip
    console.log(CurrentBuddy)
    getnetworkStats()
    });

});
}
let streaming = {554:false,555:false,556:false}
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
      if(dataSplitEachLine[1] === currentip+':'+port){
         if(dataSplitEachLine[3]==='ESTABLISHED'){
            streaming[port] = true
          }
          else{
            streaming[port] = false
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
  console.log(streaming)
    if(streaming['554'] | streaming['555'] | streaming['556']){
      if(synching===true){
        console.log('stop rsync')
        synching = false;
        rsync.kill('SIGINT');
      }
    }
    else if(!streaming['554'] | !streaming['555'] | !streaming['556']){
      if(synching===false){
        console.log('start rsync')
        synching = true;
    console.log(CurrentBuddy)
    rsync = require('child_process').spawn('rsync' ,['-avzh', '/home/pi/videos/', 'pi@'+CurrentBuddy.ip+':/home/pi/remote_backups/'+process.env.NODE_IDENTIFIER])
      
    
   
      
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

setInterval(() => { getnetworkStats() }, 30000);
getCurrentBudy()




