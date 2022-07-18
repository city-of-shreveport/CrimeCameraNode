const debug = require('debug')('updatePoeDhcp');
debug.enabled = true
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')
const dedent = require('dedent-js');

var config = {}

const writeFile = (file, text) => {
  fs.writeFile(file, text, function (error) {});
};

async function run() {
  debug("Beginning dhcp procedures");

  debug("Reading config...");

  configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');

  config = JSON.parse(configString).config;

  debug('Loaded config. Setting up dhcp...');
  debug('Updating /etc/dhcpcd.conf...');
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
      interface eth1
      static ip_address=10.10.5.1/24
    `
  );

  debug('Updating /etc/dhcp/dhcpd.conf...');
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

  debug("DHCP files written");
}

module.exports = {
  run
}
