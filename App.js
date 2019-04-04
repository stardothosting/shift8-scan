/**
 * Shift8 Scan
 * https://www.shit8web.ca
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, TextInput, View, AppRegistry, ScrollView, FlatList, Button, TouchableOpacity, Dimensions, AppState, NetInfo, AsyncStorage} from 'react-native';
import { List, ListItem, Badge, Icon, Avatar, withBadge } from 'react-native-elements';
import { TabView, TabViewPage, TabBarTop, SceneMap } from 'react-native-tab-view';

// Custom requires
import { NetworkInfo } from 'react-native-network-info';
import SubnetmaskModule from 'get-subnet-mask';
import TouchableScale from 'react-native-touchable-scale'; // https://github.com/kohver/react-native-touchable-scale
import LinearGradient from 'react-native-linear-gradient'; // Only if no expo
import ToggleSwitch from 'toggle-switch-react-native';
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

// Function to add delay
/*function sleeper(ms) {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}*/
var sleeper = function (ms) {
 return new Promise(function (resolve, reject) {
    setTimeout(() => resolve(), ms);
  });
};

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
      //client.destroy();
      client.end();
      console.log('Connected');
    });
    
    client.setTimeout(4000,function(){
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
      //sleeper(2000);
      //console.log('******* ERROR : ' + JSON.stringify(err));
      client.destroy();
      //reject(err);
    });

    setTimeout(function(){
      var isdestroyed = client.destroyed;
      console.log('Socket destroyed:' + isdestroyed);
      client.destroy();
    },6000);
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
      connection_Status: '',
      showScan: false,
      index: 0,
      routes: [
        { key: 'main', title: 'Scan' },
        { key: 'settings', title: 'Settings' },
        { key: 'about', title: 'About' },
      ],
      portScan: [ '21', '22', '25', '80', '443', '3389' ],
      isOnPort21ToggleSwitch: true,
      isOnPort22ToggleSwitch: true,
      isOnPort25ToggleSwitch: true,
      isOnPort80ToggleSwitch: true,
      isOnPort443ToggleSwitch: true,
      isOnPort3389ToggleSwitch: true,
    }
  }

  componentDidMount() {
    AsyncStorage.getItem('portScan').then((value) => this.setState({ 'portScan': JSON.parse(value) || JSON.stringify([ '21', '22', '25', '80', '443', '3389' ]) })).done();

    /*AsyncStorage.getItem('portScan').hasOwnProperty("21") == true ? this.setState({ 'isOnPort21ToggleSwitch' : true }) : this.setState({ 'isOnPort21ToggleSwitch' : false});
    AsyncStorage.getItem('portScan').hasOwnProperty("22") == true ? this.setState({ 'isOnPort22ToggleSwitch' : true }) : this.setState({ 'isOnPort22ToggleSwitch' : false});
    AsyncStorage.getItem('portScan').hasOwnProperty("25") == true ? this.setState({ 'isOnPort25ToggleSwitch' : true }) : this.setState({ 'isOnPort25ToggleSwitch' : false});
    AsyncStorage.getItem('portScan').hasOwnProperty("80") == true ? this.setState({ 'isOnPort80ToggleSwitch' : true }) : this.setState({ 'isOnPort80ToggleSwitch' : false});
    AsyncStorage.getItem('portScan').hasOwnProperty("443") == true ? this.setState({ 'isOnPort443ToggleSwitch' : true }) : this.setState({ 'isOnPort443ToggleSwitch' : false});
    AsyncStorage.getItem('portScan').hasOwnProperty("3389") == true ? this.setState({ 'isOnPort3389ToggleSwitch' : true }) : this.setState({ 'isOnPort3389ToggleSwitch' : false});
    */
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

  toggleSwitch = () => {
    var port_array = new Array();
    if (this.state.isOnPort21ToggleSwitch == true) port_array.push('21');
    if (this.state.isOnPort22ToggleSwitch == true) port_array.push('22');
    if (this.state.isOnPort25ToggleSwitch == true) port_array.push('25');
    if (this.state.isOnPort80ToggleSwitch == true) port_array.push('80');
    if (this.state.isOnPort443ToggleSwitch == true) port_array.push('443');
    if (this.state.isOnPort3389ToggleSwitch == true) port_array.push('3389');

    this.setState({ portScan: port_array});
    AsyncStorage.setItem('portScan', JSON.stringify(port_array));
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
      this.setState({ listContent: [] });

      for (let i = 0; i < response["ip_range"].length; i++) {
        for (let j = 0; j < this.state.portScan.length; j++) {
          //alert('Scanning ports : ' + JSON.stringify(this.state.portScan));
          //sleeper(2000)
          scanHost(response["ip_range"][i], this.state.portScan[j])
          .then(sleeper(10000))
          .then(response => {
            scanResult.push(response);
            this.setState({ 
              listContent: this.state.listContent.concat([response])
            });
            this.setState(state => {
              const list = state.listContent.map((item, j) => {
                alert(JSON.stringify(item));
              });
            });
            //alert(JSON.stringify(response['ip']));
            //this.setState({ 
            //  listContent: this.state.listContent.concat([response])
            //});

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

  _renderScan = () => {
    if (this.state.showScan) {
      return (
          <TouchableOpacity onPress={this.triggerScan}>
            <Text style={styles.button}>Click Me!</Text>
          </TouchableOpacity>

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
            <Text style={{fontSize: 20, textAlign: 'center', marginBottom: 20}}> You are { this.state.connection_Status } </Text>
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
                this.setState({ isOnPort21ToggleSwitch });
                this.toggleSwitch();
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
                this.setState({ isOnPort22ToggleSwitch });
                this.toggleSwitch();
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
                this.setState({ isOnPort25ToggleSwitch });
                this.toggleSwitch();
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
                this.setState({ isOnPort80ToggleSwitch });
                this.toggleSwitch();
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
                this.setState({ isOnPort443ToggleSwitch });
                this.toggleSwitch();
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
                this.setState({ isOnPort3389ToggleSwitch });
                this.toggleSwitch();
              }}
            />
          </View>
        );
      case 'about':
        return (
          <View style={styles.container}>
          <Text>About Placeholder</Text>
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
        <View key={item.ip}>
          <Text>{item.ip}</Text>
        </View>
        : null)

      /*(!item.length?
        <ListItem
          roundAvatar
          style={{width:200, height:100}}
          key={item.ip}
          title={item.ip}
          titleStyle={{ color: 'black', fontWeight: 'bold' }}
          subtitleStyle={{ color: 'black' }}
          subtitle={`Port : ${item.port}`}
          badge={{ value: `${item.port}`, textStyle: { color: 'white' }, containerStyle: { marginTop: -20 } }}
        />
        : null)*/
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
   tab: {
    backgroundColor: '#c83539',
   }
});
