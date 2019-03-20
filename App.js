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
var sip = require ('shift8-ip-func');

var net = require('react-native-tcp');
//var net = require('net');

import SubnetmaskModule from 'get-subnet-mask';
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
var scanResult = new Array();
var res = null;
var test_outside = null;

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
    }
  }

  triggerScan = () => {
    var promise1 = new Promise(function(resolve, reject) {

    // Must load all variables in sequence asynchronously
    async.series([
      /****************************
      * Assign all local IP data  *
      *****************************/
      function(callback) {
        NetworkInfo.getIPAddress(ip => { 
          local_ip = ip; 
          NetworkInfo.getBroadcast(address => {
            local_broadcast = address; 
            SubnetmaskModule.getSubnet((sb) => { 
              local_netmask = sb; 
              callback(); 
            });
          });
        });
      },
      /*************************************************
      * Assign All IP data once everything is obtained *
      *************************************************/
      function(callback) {
          subconv = ipaddr.IPv4.parse(local_netmask).prefixLengthFromSubnetMask();
          firstHost = ipaddr.IPv4.networkAddressFromCIDR(local_ip + "/" + subconv);
          lastHost = ipaddr.IPv4.broadcastAddressFromCIDR(local_ip + "/" + subconv);
          firstHostHex = sip.convertIPtoHex(firstHost);
          lastHostHex = sip.convertIPtoHex(lastHost);
          ipRange = sip.getIPRange(firstHostHex,lastHostHex);
          ipRange = ipRange.slice(1); // Remove the first ip in the array
          callback();
      },
      /*************************
      * Start array loop scans *
      *************************/
      function(callback) {

        test_outside = '1234';


        // Loop through all IPs in a scan
        async.eachSeries(ipRange, function(singleIP, callback) {
          // Loop within the loop to cycle through array of common ports
          async.eachSeries(portRange, function(singlePort, callback) {
            //var q = async.queue(
              //async.asyncify(async function(callback) {
                var client = net.connect({
                  host: singleIP,
                  port: singlePort
                },
                function(callback) { //'connect' listener
                  //alert('connected to server : ' + singleIP + ' on port : ' + singlePort);

                  scanResult.push('connected to server : ' + singleIP + ' on port : ' + singlePort);
                  //alert(res);
                  //scanResult.push(res);
                  //client.end();
                  //client.write('GET / HTTP/1.0\r\n\r\n');
                });
                client.on('error', function(err) {
                  //alert('error : ' + JSON.stringify(err));
                  client.end();
                });
            //}
            //));
            console.log('************* scanning ' + singleIP);

            //alert(JSON.stringify(scanResult));
            //q.push(singlePort);  
            callback();
          }, function(err, res) {
            if (err) {
              //console.log('error happened with port');
            } else {
              //console.log('success port!');
              //alert(JSON.stringify(res));
              alert(JSON.stringify(test_outside));


            }
          }
          );
            callback();
          }, function(err,result) {
            if (err) {
              console.log('error happened');
            } else {
              //alert(JSON.stringify(scanResult));
            }
          }
        );
        alert(res);
        callback(res);
      },
      function() {
        console.log('last function');
      }
      ]);
    }); // end promise
    promise1.then(function(value) {
      //alert(JSON.stringify(test_outside));
      //console.log(JSON.stringify(value);

      alert('****** ALL DONE***');
      // expected output: "Success!"
    });

  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to Shift8 Scan!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Button onPress = {this.triggerScan} title="hit me." color="#841584" accessibilityLabel="hit me."/>
        <TextInput editable={false} ref={component=> this._MyComponent=component}/>
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
