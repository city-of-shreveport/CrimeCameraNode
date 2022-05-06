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
  sudo parted --script ${devicePath.slice(0, -1)} mklabel gpt
  sudo parted --script -a opt ${devicePath.slice(0, -1)} mkpart primary ext4 0% 100%
  yes | sudo mkfs -t ext4 ${devicePath}
`);



