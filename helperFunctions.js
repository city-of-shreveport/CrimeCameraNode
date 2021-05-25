const dedent = require('dedent-js');
const got = require('got');
const { exec } = require('child_process');

execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve(stdout ? stdout : stderr);
    });
  });
};

bootstrapApp = async () => {
  console.log('Getting configuration information from remote server...');
  try {
    await execCommand(`sudo route del -net default gw 10.10.5.1 netmask 0.0.0.0 dev eth0 metric 202;`);

    var response = await got(
      `${process.env.CAMERA_SERVER}/api/nodes/${process.env.CAMERA_IDENTIFIER}?token=${process.env.API_KEY}`
    );

    var config = JSON.parse(response.body).config;

    if (config.zeroTierNetworkID) {
      console.log('Joining ZeroTier network...');
      await execCommand(dedent`
        curl -s https://install.zerotier.com | sudo bash;
        sudo zerotier-cli join ${config.zeroTierNetworkID};
        sudo chmod 755 -R /var/lib/zerotier-one;
        sudo service zerotier-one restart;
      `);

      await execCommand(`sudo sysctl net.ipv4.conf.ztuga7sx7i.forwarding=1;`);
    }

    console.log('Setting up firewall rules...');
    await execCommand(dedent`
      sudo iptables -P INPUT ACCEPT;
      sudo iptables -P FORWARD ACCEPT;
      sudo iptables -P OUTPUT ACCEPT;
      sudo iptables -t nat -F;
      sudo iptables -t mangle -F;
      sudo iptables -t raw -F;
      sudo iptables -F;
      sudo iptables -X;
      sudo sysctl net.ipv4.conf.eth0.forwarding=1;
      sudo sysctl net.ipv4.conf.eth1.forwarding=1;
      sudo sysctl net.ipv4.conf.wlan0.forwarding=1;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 554 -j DNAT --to 10.10.5.2:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 554 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 81 -j DNAT --to 10.10.5.2:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 80 -j ACCEPT;
      sudo iptables -t nat -A POSTROUTING -j MASQUERADE;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 555 -j DNAT --to 10.10.5.3:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 555 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 82 -j DNAT --to 10.10.5.3:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 81 -j ACCEPT;
      sudo iptables -t nat -A POSTROUTING -j MASQUERADE;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 556 -j DNAT --to 10.10.5.4:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 556 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 83 -j DNAT --to 10.10.5.4:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 82 -j ACCEPT;
      sudo iptables -t nat -A POSTROUTING -j MASQUERADE;
    `);

    console.log('Idempotently setting up encryption on video storage devices...');
    await setupStorageDrive(config.videoDriveDevicePath, config.videoDriveMountPath, config.videoDriveEncryptionKey);
    await setupStorageDrive(config.buddyDriveDevicePath, config.buddyDriveMountPath, config.buddyDriveEncryptionKey);
  } catch (error) {
    console.log('Failed to get configuration information from remote server.');
    console.log(error);
  }
};

setupStorageDrive = async (devicePath, mountPath, encryptionKey) => {
  var driveIsEncrypted = await execCommand(`lsblk -o NAME,TYPE,SIZE,MODEL | grep ${encryptionKey}`);

  if (driveIsEncrypted.includes(encryptionKey)) {
    mountStorageDrive(devicePath, mountPath, encryptionKey);
  } else {
    var driveIsFormatted = await execCommand(`blkid ${devicePath} | grep crypto_LUKS`);

    if (!driveIsFormatted.includes('crypto_LUKS')) {
      console.log(`Formatting ${devicePath}...`);
      await execCommand(dedent`
        echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksFormat ${devicePath};
        echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
        yes | sudo mkfs -t ext4 /dev/mapper/${encryptionKey};
      `);
    }

    mountStorageDrive(devicePath, mountPath, encryptionKey);
  }
};

mountStorageDrive = async (devicePath, mountPath, encryptionKey) => {
  console.log(`Mounting ${devicePath} to ${mountPath}...`);
  await execCommand(dedent`
    sudo mkdir -p ${mountPath};
    echo '${encryptionKey}' | sudo cryptsetup --batch-mode -d - luksOpen ${devicePath} ${encryptionKey};
    sudo mount /dev/mapper/${encryptionKey} ${mountPath};
    sudo chown -R pi:pi ${mountPath};
    sudo chmod 755 -R ${mountPath};
  `);
};

module.exports = { execCommand, bootstrapApp, setupStorageDrive, mountStorageDrive };
