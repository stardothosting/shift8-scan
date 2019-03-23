/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, TextInput, View, AppRegistry, ScrollView, FlatList, Button} from 'react-native';

// Custom requires
import { NetworkInfo } from 'react-native-network-info';
import HTML from 'react-native-render-html';
import SubnetmaskModule from 'get-subnet-mask';
var sip = require ('shift8-ip-func');
var net = require('react-native-tcp');
var async = require("async");
var ipaddr = require('ipaddr.js');

// Declare Variables
var local_ip = null;
var local_broadcast = null;
var local_netmask = null;
var subconv = null;
var firstHost = null;
var lastHost = null;
var firstHostHex = null;
var lastHostHex = null;
var ipRange = null;
var ipRange = null;
//var portRange = [ 20, 21, 22, 25, 80, 110, 139, 143, 443, 3389 ]
var portRange = [ 80, 443 ];
var scanResult = null;
var scan = [];
var test_var = null;

var fetchData = function () {
 return new Promise(function (resolve, reject) {
    resolve();
  });
};

var scanHost = function(hostIP, hostPort) {
  return new Promise(function (resolve,reject) {
    var client = net.connect({
      host: hostIP,
      port: hostPort
    }, 
    function() { //'connect' listener
      client.end();
      //console.log('@@@@@@@@@@@@@@@@@@@ CONNECTED ' + hostIP);
      var scan_result = {
        ip:hostIP, 
        port:hostPort
      };
      resolve(scan_result);
      //resolve('!!!!!!!!!!! connected to server : ' + hostIP + ' on port : ' + hostPort);
      //this.setState({myText : scanResult});
      //console.log('*********** connected to server : ' + ipRange[i] + ' on port : ' + portRange[j])
      //client.end();
    });
    client.on('error', function(err) {
      console.log('******* ERROR : ' + JSON.stringify(err));
      client.end();
    });
  });
}

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});
  
type Props = {};
export default class App extends Component<Props> {

  constructor(props) {
    super(props);
    this.state = {
      listContent: [],
      myText: 'original text'
    }
  }



  triggerScan = () => {

    // Gather Network Info
    var network_promise = new Promise(function(resolve, reject) {
        NetworkInfo.getIPAddress(ip => { 
          local_ip = ip; 
          NetworkInfo.getBroadcast(address => { 
            local_broadcast = address; 
              SubnetmaskModule.getSubnet((sb) => {
                local_netmask = sb;
                subconv = ipaddr.IPv4.parse(local_netmask).prefixLengthFromSubnetMask();
                firstHost = ipaddr.IPv4.networkAddressFromCIDR(local_ip + "/" + subconv);
                lastHost = ipaddr.IPv4.broadcastAddressFromCIDR(local_ip + "/" + subconv);
                firstHostHex = sip.convertIPtoHex(firstHost);
                lastHostHex = sip.convertIPtoHex(lastHost);
                ipRange = sip.getIPRange(firstHostHex,lastHostHex);
                ipRange = ipRange.slice(1); // Remove the first ip in the array
                resolve({
                  local_ip: local_ip, 
                  local_broadcast: local_broadcast, 
                  local_netmask: local_netmask, 
                  subnet_conv: subconv, 
                  first_host: firstHost, 
                  last_host: lastHost,
                  first_host_hex: firstHostHex, 
                  last_host_hex: lastHostHex, 
                  ip_range: ipRange
                });
              });
          });
        });
    });

    // Get variables and use them
    network_promise.then((response) => {
      for (let i = 0; i < response["ip_range"].length; i++) {
        for (let j = 0; j < portRange.length; j++) {
          scanHost(response["ip_range"][i], portRange[j]).then(response => {
            this.setState(prevState => ({
              listContent : [prevState.listContent, response]
            }));
          });
        }
      }
    });
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to Shift8 Scan!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Button onPress = {this.triggerScan} title="hit me." color="#841584" accessibilityLabel="hit me."/>
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
    marginTop: -80,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 0,
  },
});
