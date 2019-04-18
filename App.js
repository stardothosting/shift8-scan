/**
 * Shift8 Scan
 * https://www.shit8web.ca
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, TextInput, View, AppRegistry, ScrollView, FlatList, Button, TouchableOpacity, Dimensions, AppState, NetInfo, SectionList, Switch, AsyncStorage, Linking, Image} from 'react-native';
import { List, ListItem, Badge, Icon, Avatar, withBadge } from 'react-native-elements';
import { TabView, TabViewPage, TabBar, TabBarTop, SceneMap } from 'react-native-tab-view';

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
      //console.log('Connected');
    });
    
    client.setTimeout(2000,function(){
        // called after timeout -> same as socket.on('timeout')
        // it just tells that soket timed out => its ur job to end or destroy the socket.
        // socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
        // whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
        client.end();
        //console.log('Socket timed out');
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
      //console.log('Socket timed out !');
      client.end('Timed out!');
      // can call socket.destroy() here too.
    });

    client.on('end',function(data){
      //console.log('Socket ended from other end!');
      //console.log('End data : ' + data);
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
      //console.log('Socket destroyed:' + isdestroyed);
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
    // Set default settings if no settings exist, or pull existing settings and apply them to the state
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
        this.setState({ 'portScan' : scanPorts });
        this.setState({ 'isOnPort21ToggleSwitch' : true });
        this.setState({ 'isOnPort22ToggleSwitch' : true });
        this.setState({ 'isOnPort25ToggleSwitch' : true });
        this.setState({ 'isOnPort80ToggleSwitch' : true });
        this.setState({ 'isOnPort443ToggleSwitch' : true });
        this.setState({ 'isOnPort3389ToggleSwitch' : true });
        AsyncStorage.setItem('@portScan', JSON.stringify(scanPorts));
      }

    });

    // Detect the network settings; If on a WiFi/LAN then set state for the scan being enabled
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

  // Make sure to change the states if you suddently disconnect from WiFi
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

  // Function to reset progress and scan result states if the reset button is tapped
  resetEverything = () => {
    this.setState({progress: 0 });
    this.setState({listContent: new Array() });
    scanResult = new Array();
  }

  // Function to handle changing the ports to scan on the settings page
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

  // Function to start a scan of your LAN based on detected IP, subnet, gateway and other info
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
          // With results , set states to display and update progress bar
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

  // Render the scan area
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
              onColor='#55E662'
              offColor='#dddddd'
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
              onColor='#55E662'
              offColor='#dddddd'
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
              onColor='#55E662'
              offColor='#dddddd'
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
              onColor='#55E662'
              offColor='#dddddd'
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
              onColor='#55E662'
              offColor='#dddddd'
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
              onColor='#55E662'
              offColor='#dddddd'
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
          <Image
           style={{width:100, height:100}}
           source={{uri: 'data:image/png;base64,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'}}
           />
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

  _renderPage = (props) =>  <TabViewPage {...props} renderScene={this._renderScene} />;

  _renderTabBar = (props) =>
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#f50057' }}
      style={{ backgroundColor: '#f50057' }}
    />
  ;

  render() {
    return (
      <TabView
        tabBarPosition={'bottom'}
        renderScene={this._renderScene}
        onIndexChange={index => this.setState({ index })}
        navigationState={this.state}
        renderTabBar={this._renderTabBar}
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
    backgroundColor: '#f50057',
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
    backgroundColor: '#f50057',
   },
   tabBar: {
    flexDirection: 'row',
    backgroundColor:'#999999',
    },
   progress: {
    margin: 10,
  },
});
