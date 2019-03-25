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
import { List, ListItem } from 'react-native-elements';

// Custom requires
import { NetworkInfo } from 'react-native-network-info';
import SubnetmaskModule from 'get-subnet-mask';
import TouchableScale from 'react-native-touchable-scale'; // https://github.com/kohver/react-native-touchable-scale
import LinearGradient from 'react-native-linear-gradient'; // Only if no expo
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
var portRange = [ 80, 443 ];
var scanResult = [];
var scan = [];
var test_var = null;

// Function to add delay
function sleeper(ms) {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

var fetchData = function () {
 return new Promise(function (resolve, reject) {
    resolve();
  });
};

// Function to scan hosts
var scanHost = function(hostIP, hostPort) {
  return new Promise(function (resolve,reject) {
    //console.log('%%%%%%%%% DOING ' + hostIP + ' ON ' + hostPort)
    var client = net.connect({
      host: hostIP,
      port: hostPort
    }, 
    function() { //'connect' listener
      client.destroy();
      console.log('Connected');
    });
    
    client.setTimeout(2000,function(){
        // called after timeout -> same as socket.on('timeout')
        // it just tells that soket timed out => its ur job to end or destroy the socket.
        // socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
        // whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
        console.log('Socket timed out');
    });

    client.on('connect', function() {
        //sleeper(200);
        //client.destroy();
        var scan_result = {
        ip:hostIP, 
        port:hostPort
        };
        resolve(scan_result);
    })
    
    client.on('timeout',function(){
      console.log('Socket timed out !');
      client.end('Timed out!');
      // can call socket.destroy() here too.
    });

    client.on('end',function(data){
      console.log('Socket ended from other end!');
      console.log('End data : ' + data);
    });

    client.on('close',function(error){
      var bread = client.bytesRead;
      var bwrite = client.bytesWritten;
      //console.log('Bytes read : ' + bread);
      //console.log('Bytes written : ' + bwrite);
      //console.log('Socket closed!');
      //if(error){
      //  console.log('Socket was closed coz of transmission error');
      //}
    }); 

    client.on('error', function(err) {
      sleeper(1000);
      console.log('******* ERROR : ' + JSON.stringify(err));
      client.destroy();
      //reject(err);
    });

    setTimeout(function(){
      var isdestroyed = client.destroyed;
      console.log('Socket destroyed:' + isdestroyed);
      client.destroy();
    },5000);
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
          scanHost(response["ip_range"][i], portRange[j]) 
          //.then(sleeper(5000))
          .then(response => {
            scanResult.push(response);
            this.setState({ 
              listContent: this.state.listContent.concat([response])
            });
          })
          .catch(err => {
            console.error(err);
            return err;
          })
        }
      }
    })
    .catch(err => {
      console.error(err);
      return err;
    })
  }

renderRow ({ item }) {
  return (
    (!item.length?
      <ListItem
        roundAvatar
        style={{width:200, height:100}}
        title={item.ip}
        titleStyle={{ color: 'black', fontWeight: 'bold' }}
        subtitleStyle={{ color: 'black' }}
        subtitle={`Port : ${item.port}`}
        chevronColor="black"
        chevron
      />
      : null)
  )
}

keyExtractor = (item, index) => index.toString()

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to Shift8 Scan!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Button onPress = {this.triggerScan} title="hit me." color="#841584" accessibilityLabel="hit me."/>
        <FlatList 
           keyExtractor={this.keyExtractor}
           data={this.state.listContent}
           extraData={this.state.listContent}
           renderItem={this.renderRow}
        />
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
    marginTop: 100,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 0,
  },
});
