require('dotenv').config();

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



  execCommand(dedent`

`);



