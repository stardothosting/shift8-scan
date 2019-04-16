/**
 * Shift8 Scan
 * https://www.shit8web.ca
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, TextInput, View, AppRegistry, ScrollView, FlatList, Button, TouchableOpacity, Dimensions, AppState, NetInfo, SectionList, Switch, AsyncStorage, Linking} from 'react-native';
import { List, ListItem, Badge, Icon, Avatar, withBadge } from 'react-native-elements';
import { TabView, TabViewPage, TabBarTop, SceneMap } from 'react-native-tab-view';

// Custom requires
import * as Progress from 'react-native-progress';
import { NetworkInfo } from 'react-native-network-info';
import SubnetmaskModule from 'get-subnet-mask';
import TouchableScale from 'react-native-touchable-scale'; // https://github.com/kohver/react-native-touchable-scale
import LinearGradient from 'react-native-linear-gradient'; // Only if no expo
import ToggleSwitch from 'toggle-switch-react-native';
var debounce = require('lodash.debounce');
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
var scanResult = [];
var scan = [];
var test_var = null;
var scanPorts = [ "21" , "22" , "25" , "80", "443" , "3389" ];

// Function to ensure array items are unique
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

// Function to add delay
var sleeper = function (ms) {
 return new Promise(function (resolve, reject) {
    setTimeout(() => resolve(), ms);
  });
};

// Function to scan hosts
var scanHost = function(hostIP, hostPort) {
  return new Promise(function (resolve,reject) {
    var client = net.connect({
      host: hostIP,
      port: hostPort
    }, 
    function() { //'connect' listener
      console.log('Connected');
    });
    
    client.setTimeout(2000,function(){
        // called after timeout -> same as socket.on('timeout')
        // it just tells that soket timed out => its ur job to end or destroy the socket.
        // socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
        // whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
        client.end();
        console.log('Socket timed out');
    });

    client.on('connect', function() {
        client.end('finished');
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
    }); 

    client.on('error', function(err) {
      client.destroy();
    });

    setTimeout(function(){
      var isdestroyed = client.destroyed;
      console.log('Socket destroyed:' + isdestroyed);
      client.destroy();
    },4000);
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
      progress: 0,
      listContent: [],
      connection_Status: '',
      showScan: false,
      cancelScan: false,
      index: 0,
      routes: [
        { key: 'main', title: 'Scan' },
        { key: 'settings', title: 'Settings' },
        { key: 'about', title: 'About' },
      ],
      portScan: [],
      isOnPort21ToggleSwitch: true,
      isOnPort22ToggleSwitch: true,
      isOnPort25ToggleSwitch: true,
      isOnPort80ToggleSwitch: true,
      isOnPort443ToggleSwitch: true,
      isOnPort3389ToggleSwitch: true,
    }
  }

  componentDidMount() {

    AsyncStorage.getItem('@portScan').then((item) => {
      if (item) {
        //console.log('FOUND ITEM :  ' + JSON.parse(item));
        var parsed_item = JSON.parse(item);
        this.setState({ 'portScan': parsed_item });
        item.indexOf("21") > -1 ? this.setState({ 'isOnPort21ToggleSwitch' : true }) : this.setState({ 'isOnPort21ToggleSwitch' : false});
        item.indexOf("22") > -1 ? this.setState({ 'isOnPort22ToggleSwitch' : true }) : this.setState({ 'isOnPort22ToggleSwitch' : false});
        item.indexOf("25") > -1 ? this.setState({ 'isOnPort25ToggleSwitch' : true }) : this.setState({ 'isOnPort25ToggleSwitch' : false});
        item.indexOf("80") > -1 ? this.setState({ 'isOnPort80ToggleSwitch' : true }) : this.setState({ 'isOnPort80ToggleSwitch' : false});
        item.indexOf("443") > -1 ? this.setState({ 'isOnPort443ToggleSwitch' : true }) : this.setState({ 'isOnPort443ToggleSwitch' : false});
        item.indexOf("3389") > -1 ? this.setState({ 'isOnPort3389ToggleSwitch' : true }) : this.setState({ 'isOnPort3389ToggleSwitch' : false});
      } else {
        //console.log('NOT FOUND ITEM : ' + JSON.stringify(scanPorts));
        this.setState({ 'portScan' : JSON.stringify(scanPorts) });
        this.setState({ 'isOnPort21ToggleSwitch' : true });
        this.setState({ 'isOnPort22ToggleSwitch' : true });
        this.setState({ 'isOnPort25ToggleSwitch' : true });
        this.setState({ 'isOnPort80ToggleSwitch' : true });
        this.setState({ 'isOnPort443ToggleSwitch' : true });
        this.setState({ 'isOnPort3389ToggleSwitch' : true });
        AsyncStorage.setItem('@portScan', JSON.stringify(scanPorts));
      }

    });

    NetInfo.addEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
    NetInfo.getConnectionInfo().then((connectionInfo) => {
      //console.log('Initial, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
      if(connectionInfo.type === 'wifi') {
      this.setState({
        connection_Status : "Online",
        showScan: true,
      });
      } else {
      this.setState({
        connection_Status : "Offline",
        showScan: false,
      });
      }
    });
  }

  componentWillUnmount() {
    NetInfo.removeEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
  }

  _handleConnectivityChange = (connectionInfo) => {
    if(connectionInfo.type === 'wifi') {
      this.setState({
        connection_Status : "Online",
        showScan: true,
      });
      this.setState
    } else {
      this.setState({
        connection_Status : "Offline",
        showScan: false,
      });
    }
  };

  resetEverything = () => {
    this.setState({progress: 0 });
    this.setState({listContent: new Array() });
  }

  toggleSwitch = () => {
    var port_array = new Array();
    if (this.state.isOnPort21ToggleSwitch) { port_array.push('21'); }
    if (this.state.isOnPort22ToggleSwitch) { port_array.push('22'); }
    if (this.state.isOnPort25ToggleSwitch) { port_array.push('25'); }
    if (this.state.isOnPort80ToggleSwitch) { port_array.push('80'); }
    if (this.state.isOnPort443ToggleSwitch) { port_array.push('443'); }
    if (this.state.isOnPort3389ToggleSwitch) { port_array.push('3389'); }
    
    //console.log('Port array : ' + JSON.stringify(port_array));
    this.setState({ portScan: port_array  });
    AsyncStorage.setItem('@portScan', JSON.stringify(port_array));
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
      // Clear scan result array
      //this.setState({ listContent: [] });
      var portScan = this.state.portScan;

      // Nested for-loops to iterate across ips and ports
      for (let i = 0, p = Promise.resolve(); i < response["ip_range"].length; i++) {
        var total_ips = response["ip_range"].length;
        // Exit the loop and reset if cancelled
          p = p.then(_ => new Promise(resolve_1 =>
              setTimeout(function () {
                // nested start
                for (let j = 0, q = Promise.resolve(); j < portScan.length; j++) {
                    q = q.then(_ => new Promise(resolve_2 =>
                        setTimeout(function () {
                          Promise.resolve()
                          .then(scanHost(response["ip_range"][i], portScan[j])
                            .then(ok => {
                              // Prepare object to push
                              var scanPush = {};
                              scanPush["ip"] = ok.ip;
                              scanPush["ports"] = [ok.port];

                              // Check if IP exists in array yet
                              var arr_check = scanResult.findIndex(x => x.ip == scanPush["ip"]);
                              if (arr_check === -1) {
                                  scanResult.push(scanPush);
                              } else {
                                  // If ip exists, merge ports old and new and remove duplicates
                                  scanPush["ports"] = scanResult[arr_check].ports.concat(scanPush["ports"]).unique();
                                  scanResult[arr_check] = scanPush;
                              }                              
                            }))
                          .then(
                            resolve_2(scanResult)
                          )
                        }, 10)
                    ));
                }
                // nested end
                resolve_1(scanResult);
              }, 1)
          ));
          p.then(response => {
            if (scanResult && scanResult.length > 0) {
                this.setState({ listContent: [...this.state.listContent, scanResult]});
                this.setState({ listContent: scanResult});
                //console.log('SCAN RESULT : ' + JSON.stringify(scanResult));
                //console.log('IP Address : ' + i + ' out of total : ' + total_ips);
                var current_progress = i / total_ips;
                this.setState({ progress: current_progress });
            }
          });
      }
    })
    .catch(err => {
      console.error(err);
      return err;
    })
  }

  _renderScan = () => {
    if (this.state.showScan) {
      return (
        <View style={styles.scanContainer}>
          <TouchableOpacity 
            onPress={this.triggerScan} 
            accessibilityRole="link"
            {...this.props}
          >
            <Text style={styles.button} accessibilityRole="link">Scan Your Network</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={this.resetEverything} 
            accessibilityRole="link"
            {...this.props}
          >
            <Text style={styles.buttonReset} accessibilityRole="link">Reset</Text>
          </TouchableOpacity>
          </View>
      );
    } else {
      return (
        <Text>You are not connected to a Wifi network and as a result cannot initiate any scans</Text>
      );
    }
  }

keyExtractor = (item, index) => index.toString()

// Main render with state updates
  _renderScene = ({ route }) => {
    switch (route.key) {
      case 'main':
        return (
            <View style={styles.container}>
            <View style={styles.main}>
            {this._renderScan()} 
            <Progress.Bar
            style={styles.progress}
            progress={this.state.progress}
            indeterminate={this.state.indeterminate}
            />
            </View>
            <FlatList 
               keyExtractor={(item, index) => index.toString() }
               data={this.state.listContent}
               extraData={this.state.listContent}
               renderItem={this.renderRow}
            />
          </View>
        );
      case 'settings':
        return (
          <View style={styles.container}>
          <Text>Choose which ports to scan</Text>
           <ToggleSwitch
              isOn={this.state.isOnPort21ToggleSwitch}
              onColor='green'
              offColor='red'
              label='TCP Port 21'
              labelStyle={{color: 'black', fontWeight: '900', margin:10}}
              size='small'
              onToggle={isOnPort21ToggleSwitch => {
                  this.setState({ 
                    isOnPort21ToggleSwitch }, () => {
                      this.toggleSwitch();
                    }); 
              }}
            />

            <ToggleSwitch
              isOn={this.state.isOnPort22ToggleSwitch}
              onColor='green'
              offColor='red'
              label='TCP Port 22'
              labelStyle={{color: 'black', fontWeight: '900', margin:10}}
              size='small'
              onToggle={isOnPort22ToggleSwitch => {
                 this.setState({ 
                    isOnPort22ToggleSwitch }, () => {
                      this.toggleSwitch();
                    }); 
              }}
            />
            <ToggleSwitch
              isOn={this.state.isOnPort25ToggleSwitch}
              onColor='green'
              offColor='red'
              label='TCP Port 25'
              labelStyle={{color: 'black', fontWeight: '900', margin:10}}
              size='small'
              onToggle={isOnPort25ToggleSwitch => {
                 this.setState({ 
                    isOnPort25ToggleSwitch }, () => {
                      this.toggleSwitch();
                    }); 
              }}
            />
            <ToggleSwitch
              isOn={this.state.isOnPort80ToggleSwitch}
              onColor='green'
              offColor='red'
              label='TCP Port 80'
              labelStyle={{color: 'black', fontWeight: '900', margin:10}}
              size='small'
              onToggle={isOnPort80ToggleSwitch => {
                 this.setState({ 
                    isOnPort80ToggleSwitch }, () => {
                      this.toggleSwitch();
                    }); 
              }}
            />
            <ToggleSwitch
              isOn={this.state.isOnPort443ToggleSwitch}
              onColor='green'
              offColor='red'
              label='TCP Port 443'
              labelStyle={{color: 'black', fontWeight: '900', margin:10}}
              size='small'
              onToggle={isOnPort443ToggleSwitch => {
                 this.setState({ 
                    isOnPort443ToggleSwitch }, () => {
                      this.toggleSwitch();
                    }); 
              }}
            />
            <ToggleSwitch
              isOn={this.state.isOnPort3389ToggleSwitch}
              onColor='green'
              offColor='red'
              label='TCP Port 3389'
              labelStyle={{color: 'black', fontWeight: '900', margin:10}}
              size='small'
              value='3389'
              onToggle={isOnPort3389ToggleSwitch => {
                 this.setState({ 
                    isOnPort3389ToggleSwitch }, () => {
                      this.toggleSwitch();
                    }); 
              }}
            />
          </View>
        );
      case 'about':
        return (
          <View style={styles.container}>
          <Text style={{padding:10}}>Shift8 Scan is a proof of concept TCP port scanner written in React Native.</Text>
          <Text style={{padding:10}}>Using an array of a definable set of TCP ports, you can scan your local network to see which devices are avaialble.</Text>
          <Text style={{color: 'blue', padding:10}}
            onPress={() => Linking.openURL('https://www.shift8web.ca/')}>
            Visit Shift8 to learn more
            </Text>
          </View>
        );
    }
  }

  _renderPage = (props) => <TabViewPage {...props} renderScene={this._renderScene} />;

  render() {
    return (
      <TabView
        navigationState={this.state}
        tabBarPosition={'bottom'}
        renderScene={this._renderScene}
        onIndexChange={index => this.setState({ index })}
        initialLayout={{ width: 100 }}
      />
    );
  }

  renderRow ({ item }) {
    return (
      (!item.length?
        <ListItem
          roundAvatar
          style={{width:250, height:50}}
          key={item.ip}
          title={item.ip}
          titleStyle={{ color: 'black', fontWeight: 'bold' }}
          subtitleStyle={{ color: 'black' }}
          //subtitle={`Port : ${item.ports}`}
          badge={{ value: `${item.ports}`, textStyle: { color: 'white' }, containerStyle: { marginTop: -20 } }}
        />
        : null)
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  scanContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  main: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 100,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 0,
  },
  textInput: {
    margin: 5,
    height: 100,
    width:200,
    borderWidth: 1,
    backgroundColor: '#7685ed'
   },
   toggleswitch: {
    margin:10,
    padding:10
   },
   button: {
    backgroundColor: '#c83539',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 4,
    color: 'white',
    fontSize: 14,
    fontWeight: 'normal',
    overflow: 'hidden',
    padding: 6,
    textAlign:'center',
   },
   buttonReset: {
    backgroundColor: '#55E662',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 4,
    color: 'black',
    fontSize: 14,
    fontWeight: 'normal',
    overflow: 'hidden',
    padding: 6,
    textAlign:'center',
   },
   tab: {
    backgroundColor: '#c83539',
   },
   progress: {
    margin: 10,
  },
});
