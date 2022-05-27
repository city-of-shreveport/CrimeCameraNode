require('dotenv').config();
const got = require('got')
const fetch = require('node-fetch');
  const promise = require('promise');
const { exec, execSync, spawn } = require('child_process');
const formatArguments = (template) => {
    return template
      .replace(/\s+/g, ' ')
      .replace(/\s/g, '\n')
      .split('\n')
      .filter((arg) => (arg != '' ? true : false));
  };

const execCommand = (command) => {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        resolve(stdout ? stdout : stderr);
      });
    });
  };
let nodes = []
  fetch('http://rtcc-server.shreveport-it.org:3000/api/nodes')
  .then((response) => response.json())
  .then((json) => {
    json.forEach(
      function (node) {
        
        try {
          execCommand(`sshpass -p ${process.env.SSH_KEY} ssh-copy-id pi@`+node.config.ip);
        } catch (error) {
          console.log(error);
        }
      }
    );
 
  });
   

 
//Loop RSYNC every hour


//rsync -avzh /home/pi/videos/camera1 pi@10.10.30.141:/home/pi/remote_backups/CrimeCamera074/caemra1/

