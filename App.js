/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';


// Custom requires
import { NetworkInfo } from 'react-native-network-info';
var sip = require ('shift8-ip-func');
var net = require('react-native-tcp');
import SubnetmaskModule from 'get-subnet-mask';
var async = require("async");

//var local_ip = NetworkInfo.getIPAddress(ip => () => return(ip));
//alert(local_ip);

var local_ip = null;
var local_broadcast = null;
var local_netmask = null;

// Must load all variables in sequence asynchronously
async.series([
  function(callback) {
    NetworkInfo.getIPAddress(ip => { local_ip = ip; callback(); });
  },
  function(callback) {
    NetworkInfo.getBroadcast(address => {local_broadcast = address; callback(); });
  },
  function(callback) {
    SubnetmaskModule.getSubnet((sb) => { local_netmask = sb; callback(); });
  },
  /************************************************
  * Main function now that everything is assigned *
  ************************************************/
  function(callback) {
      console.log('Local ip : ' + local_ip);
      console.log('Local broadcast : ' + local_broadcast);
      console.log('Local netmask : ' + local_netmask);
  }
  ]);



function returnValue(method, value) {
  switch (method) {
    case 'local_ip': 
      local_ip = value;
      alert('value : ' + value);
      break;
    case 'local_subnet':
      local_subnet = value;
      break;
    case 'local_netmask':
      local_netmask = value;
      break;
  }
}

//alert(local_ip);

/*console.log('hey');
var iphex = sip.convertIPtoHex('192.168.1.1');
console.log('ip address : ' + iphex);

console.log('net : ' + JSON.stringify(net));

var client = net.createConnection(80, '10.0.1.102');
console.log('Socket created.');
client.on('data', function(data) {
  // Log the response from the HTTP server.
  console.log('RESPONSE: ' + data);
}).on('connect', function() {
  // Manually write an HTTP request.
  client.write("GET / HTTP/1.0\r\n\r\n");
}).on('end', function() {
  console.log('DONE');
});*/


const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
