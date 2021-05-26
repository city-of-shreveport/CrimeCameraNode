const dedent = require('dedent-js');
const fs = require('@mh-cbon/sudo-fs');
const got = require('got');
const { exec } = require('child_process');

require('events').EventEmitter.defaultMaxListeners = 100;

execCommand = (command) => {
  console.log(`Executing command: \n${command}\n`);

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      resolve(stdout ? stdout : stderr);
    });
  });
};

writeFile = (file, text) => {
  console.log(`writing file ${file}...\n`);

  fs.writeFile(file, text, function (error) {});
};

bootstrapApp = async () => {
  try {
    console.log('resetting firewall and routing rules...');
    await execCommand(dedent`
      sudo iptables -P INPUT ACCEPT;
      sudo iptables -P FORWARD ACCEPT;
      sudo iptables -P OUTPUT ACCEPT ;
      sudo iptables -t nat -F;
      sudo iptables -t mangle -F;
      sudo iptables -t raw -F;
      sudo iptables -F;
      sudo iptables -X;
      sudo route del -net default gw 10.10.5.1 netmask 0.0.0.0 dev eth0 metric 202;
    `);

    console.log('Getting configuration information from remote server...');
    var response = await got(
      `${process.env.CAMERA_SERVER}/api/nodes/${process.env.CAMERA_IDENTIFIER}?token=${process.env.API_KEY}`
    );

    var config = JSON.parse(response.body).config;

    console.log('setting hostname...');
    await execCommand(`sudo hostname ${config.hostName}`);

    console.log('updating /etc/hosts...');
    writeFile(
      '/etc/hosts',
      dedent`
        # ipv4
        127.0.0.1 localhost
        127.0.1.1 ${config.hostName}

        # ipv6
        ::1     localhost ip6-localhost ip6-loopback
        ff02::1 ip6-allnodes
        ff02::2 ip6-allrouters
      `
    );

    console.log('updating /etc/dhcp/dhcpd.conf...');
    writeFile(
      '/etc/dhcp/dhcpd.conf',
      dedent`
        option domain-name "crime-camera.local";
        option domain-name-servers 8.8.8.8, 8.8.4.4;

        subnet 10.10.5.0 netmask 255.255.255.0 {
          range 10.10.5.2 10.10.5.4;
          option subnet-mask 255.255.255.0;
          option broadcast-address 10.10.5.255;
          option routers 10.10.5.1;
        }

        default-lease-time 6000;
        max-lease-time 7200;
        authoritative;
      `
    );

    console.log('updating /etc/dhcpcd.conf...');
    writeFile(
      '/etc/dhcpcd.conf',
      dedent`
        hostname
        clientid
        persistent
        option rapid_commit
        option domain_name_servers, domain_name, domain_search, host_name
        option classless_static_routes
        option interface_mtu
        require dhcp_server_identifier
        slaac private
        interface eth0
        static ip_address=10.10.5.1/24
        static routers=10.10.5.1/24
      `
    );

    console.log('updating /etc/default/isc-dhcp-server...');
    writeFile(
      '/etc/dhcpcd.conf',
      dedent`
        hostname
        clientid
        persistent
        option rapid_commit
        option domain_name_servers, domain_name, domain_search, host_name
        option classless_static_routes
        option interface_mtu
        require dhcp_server_identifier
        slaac private
        interface eth0
        static ip_address=10.10.5.1/24
        static routers=10.10.5.1/24
      `
    );

    console.log('updating /etc/default/isc-dhcp-server...');
    writeFile(
      '/etc/default/isc-dhcp-server',
      dedent`
        # Defaults for isc-dhcp-server (sourced by /etc/init.d/isc-dhcp-server)

        # Path to dhcpd's config file (default: /etc/dhcp/dhcpd.conf).
        #DHCPDv4_CONF=/etc/dhcp/dhcpd.conf
        #DHCPDv6_CONF=/etc/dhcp/dhcpd6.conf

        # Path to dhcpd's PID file (default: /var/run/dhcpd.pid).
        #DHCPDv4_PID=/var/run/dhcpd.pid
        #DHCPDv6_PID=/var/run/dhcpd6.pid

        # Additional options to start dhcpd with.
        # Don't use options -cf or -pf here; use DHCPD_CONF/ DHCPD_PID instead
        #OPTIONS=""

        # On what interfaces should the DHCP server (dhcpd) serve DHCP requests?
        # Separate multiple interfaces with spaces, e.g. "eth0 eth1".
        INTERFACESv4="eth0"
      `
    );

    if (config.zeroTierNetworkID) {
      console.log('Joining ZeroTier network...');
      await execCommand(dedent`
        curl -s https://install.zerotier.com | sudo bash;
        sudo zerotier-cli join ${config.zeroTierNetworkID};
        sudo service zerotier-one restart;
      `);
    } else {
      console.log('uninstalling existing zerotier instance...');
      await execCommand(dedent`
        sudo zerotier-cli leave ${config.zeroTierNetworkID};
        sudo service zerotier-one stop;
        sudo apt remove -y zerotier-one;
        sudo find / -iname "*zerotier*" -exec sudo rm -rf {};
      `);

      console.log('installing zerotier...');
      await execCommand(dedent`
        curl -s https://install.zerotier.com | sudo bash
        sudo zerotier-cli join ${config.zeroTierNetworkID}
        sudo service zerotier-one restart;
      `);
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
      sudo sysctl net.ipv4.conf.ztuga7sx7i.forwarding=1;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 554 -j DNAT --to 10.10.5.2:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 554 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 81 -j DNAT --to 10.10.5.2:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 80 -j ACCEPT;

      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 555 -j DNAT --to 10.10.5.3:554;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 555 -j ACCEPT;
      sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.zeroTierIP} --dport 82 -j DNAT --to 10.10.5.3:80;
      sudo iptables -A FORWARD -p tcp -d ${config.zeroTierIP} --dport 81 -j ACCEPT;

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
    console.log('Failed to bootstrap the app!');
    console.log(error);
  }
};

setupStorageDrive = async (devicePath, mountPath, encryptionKey) => {
  var driveIsEncrypted = await execCommand(`sudo lsblk -o NAME,TYPE,SIZE,MODEL | grep ${encryptionKey}`);

  if (driveIsEncrypted.includes(encryptionKey)) {
    mountStorageDrive(devicePath, mountPath, encryptionKey);
  } else {
    var driveIsFormatted = await execCommand(`sudo blkid ${devicePath} | grep crypto_LUKS`);

    if (!driveIsFormatted.includes('crypto_LUKS')) {
      console.log(`Formatting ${devicePath}...`);

      await execCommand(dedent`
        sudo parted --script ${devicePath.slice(0, -1)} mklabel gpt
        sudo parted --script -a opt ${devicePath.slice(0, -1)} mkpart primary ext4 0% 100%
        yes | sudo mkfs -t ext4 ${devicePath}
      `);

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
