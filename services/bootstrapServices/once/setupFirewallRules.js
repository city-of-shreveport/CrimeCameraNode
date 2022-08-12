const debug = require('debug')('setupFirewallRules');
debug.enabled = true
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')
const dedent = require('dedent-js');

var config = {}

async function run() {
  debug("Beginning setupFirewallRules procedures");

  debug("Reading config...");

  configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');

  config = JSON.parse(configString).config;

  debug('Loaded config. Setting up firewall rules...');

  var {stdout, stderr} = await exec(dedent`
    sudo sysctl net.ipv4.conf.eth0.forwarding=1;
    sudo sysctl net.ipv4.conf.eth1.forwarding=1;
    sudo sysctl net.ipv4.conf.wlan0.forwarding=1;
    sudo sysctl net.ipv4.conf.ztuga5uslj.forwarding=1;

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 554 -j DNAT --to 10.10.5.2:554;
    sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 554 -j ACCEPT;
    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 81 -j DNAT --to 10.10.5.2:80;
    sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 81 -j ACCEPT;

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 555 -j DNAT --to 10.10.5.3:554;
    sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 555 -j ACCEPT;
    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 82 -j DNAT --to 10.10.5.3:80;
    sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 82 -j ACCEPT;

    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 556 -j DNAT --to 10.10.5.4:554;
    sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 556 -j ACCEPT;
    sudo iptables -t nat -A PREROUTING -p tcp -s 0/0 -d ${config.ip} --dport 83 -j DNAT --to 10.10.5.4:80;
    sudo iptables -A FORWARD -p tcp -d ${config.ip} --dport 83 -j ACCEPT;

    sudo iptables -t nat -A POSTROUTING -j MASQUERADE;
  `);

  debug(stdout);
  debug(stderr);
}

module.exports = {
  run
}
