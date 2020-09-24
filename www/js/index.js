// (c) 2014 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton */
/* global detailPage, resultDiv, pulseWidthInput, motorButton, buzzerButton, disconnectButton */
/* global ble, cordova */
/* jshint browser: true , devel: true*/

function bin2string(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result += (String.fromCharCode(array[i]));
  }
  return result;
}
var dog = [];
var bow_bow = [];

// ASCII only

function byte2string(data) {
  const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
  var count = data.length;
  var str = "";

  for (var index = 0; index < count;) {
    var ch = data[index++];
    if (ch & 0x80) {
      var extra = extraByteMap[(ch >> 3) & 0x07];
      if (!(ch & 0x40) || !extra || ((index + extra) > count))
        return null;

      ch = ch & (0x3F >> extra);
      for (; extra > 0; extra -= 1) {
        var chx = data[index++];
        if ((chx & 0xC0) != 0x80)
          return null;

        ch = (ch << 6) | (chx & 0x3F);
      }
    }

    str += String.fromCharCode(ch);
  }

  return str;
}

'use strict';

// this is MetaWear's UART service
var metawear = {
  serviceUUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  txCharacteristic: "6e400002-b5a3-f393-e0a9-e50e24dcca9e", // transmit is from the phone's perspective
  rxCharacteristic: "6e400003-b5a3-f393-e0a9-e50e24dcca9e" // receive is from the phone's perspective
};
var heartRate = {
  service: '180d',
  measurement: '2a37'
};
var battery = {
  service: "1800",
  level: "2a01"
};

var app = {
  deviceId: "",
  initialize: function() {
    this.bindEvents();
    detailPage.hidden = true;
  },
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
    motorButton.addEventListener('click', this.onMotorButton, false);
    readButton.addEventListener('click', this.onReadButton, false);
    heartRateButton.addEventListener('click', this.onHeartRateButton, false);
		heartRateRealTimeButton.addEventListener('click', this.onHeartRateRealTimeButton, false);
    bloodPressureButton.addEventListener('click', this.onBloodPressureButton, false);
    bloodOxygenButton.addEventListener('click', this.onBloodOxygenButton, false);
    vibrateButton.addEventListener('click', this.onVibrateButton, false);
    buzzerButton.addEventListener('click', this.onBuzzerButton, false);
    disconnectButton.addEventListener('touchstart', this.disconnect, false);
    deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
  },
  onDeviceReady: function() {
    app.refreshDeviceList();
  },
  refreshDeviceList: function() {
    deviceList.innerHTML = ''; // empties the list
    if (cordova.platformId === 'android') { // Android filtering is broken
      ble.scan([], 5, app.onDiscoverDevice, app.onError);
    } else {
      ble.scan([metawear.serviceUUID], 5, app.onDiscoverDevice, app.onError);
    }
  },
  onDiscoverDevice: function(device) {
    var listItem = document.createElement('li'),
      html = '<b>' + device.name + '</b><br/>' +
      'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
      device.id;

    listItem.dataset.deviceId = device.id;
    listItem.innerHTML = html;
    deviceList.appendChild(listItem);
  },
  connect: function(e) {
    app.deviceId = e.target.dataset.deviceId;

    function onDone(data) {

      var a = new Uint8Array(data);
      console.log(a)
      //console.log("Data : " + JSON.stringify(data))
    }

    var onConnect = function(data) {
      console.log('CONNECT DATA  ' + JSON.stringify(data))
      ble.startNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
      setTimeout(() => {
        ble.stopNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
      }, 2000)

      //app.enableButtonFeedback(app.subscribeForIncomingData, app.onError);
      app.showDetailPage();
    };

    ble.connect(app.deviceId, onConnect, app.onError);



    // setTimeout(() => {
    //   ble.startNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
    // 	setTimeout(()=>{
    // 		ble.stopNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
    // 	},2000)
    // }, 2000)

  },
  onReadButton: function() {
    console.log('--------Read Property--------')
    app.scan();
  },
  scan: function() {
    //console.log('check scan')
    function onDone(data) {
      var a = new Uint8Array(data);
      console.log("Data : " + a)
    }

    function onError(err) {
      console.log("Error : " + err)
    }

    function onDone1(data) {

      console.log("Data : " + JSON.stringify(data))
    }

    var id = "1800"
    var char = ["2a00", "2a01", "2a02", "2a04", "2aa6"]
    for (var i = 0; i < char.length; i++) {
      console.log("Service: " + id + " char: " + char[i])
      ble.read(app.deviceId, id, char[i], onDone, onError);
    }
    var id1 = "1812"
    var char1 = ["2a4e", "2a4d", "2a33", "2a4b", "2a4a"]
    async function delay() {
      await setTimeout(() => {}, 500)
    }
    for (var i = 0; i < char1.length; i++) {
      console.log("Service: " + id1 + " char: " + char1[i])
      ble.read(app.deviceId, id1, char1[i], onDone, onError);
      delay()
    }

    // ble.isConnected(app.deviceId, onDone, onError);
    // ble.connectedPeripheralsWithServices([],  onDone, onError);
    // ble.bondedDevices(onDone,onError)
    // console.log("Scanning for Heart Rate Monitor");
    //
    // var foundHeartRateMonitor = false;
    //
    // function onScan(peripheral) {
    //   // this is demo code, assume there is only one heart rate monitor
    //   console.log("Found " + JSON.stringify(peripheral));
    //   foundHeartRateMonitor = true;
    // 	//peripheral.id will come
    //   ble.connect("D9:43:A3:33:95:CE", app.onConnect, app.onDisconnect);
    // }
    //
    // function scanFailure(reason) {
    //   alert("BLE Scan Failed");
    // }
    //
    // //ble.scan([], 5, onScan, scanFailure);
    // ble.connect("D9:43:A3:33:95:CE", app.onConnect, app.onDisconnect);
    //
    // // setTimeout(function() {
    // //   if (!foundHeartRateMonitor) {
    // //     console.log("Did not find a heart rate monitor.");
    // //   }
    // // }, 5000);
  },
  onConnect: function(peripheral) {
    console.log("Connected to " + peripheral.id);
    ble.startNotification(peripheral.id, battery.service, battery.level, app.onData1, app.onError1);
  },
  onDisconnect: function(reason) {
    console.log("Disconnected " + reason);
    //beatsPerMinute.innerHTML = "...";
    app.status("Disconnected");
  },
  onData1: function(buffer) {
    // assuming heart rate measurement is Uint8 format, real code should check the flags
    // See the characteristic specs http://goo.gl/N7S5ZS
    var data = new Uint8Array(buffer);
    console.log('Data', data[1])
    //beatsPerMinute.innerHTML = data[1];
  },
  onError1: function(reason) {
    console.log("There was an error " + reason);
  },
  onData: function(buffer) { // data received from MetaWear

    var data = new Uint8Array(buffer);
    var message = "";
    console.log(byte2string(data));
    if (data[0] === 1 && data[1] === 1) { // module = 1, opscode = 1
      if (data[2] === 1) { // button state
        message = "Button pressed";
      } else {
        message = "Button released";
      }
    }

    resultDiv.innerHTML = resultDiv.innerHTML + message + "<br/>";
    resultDiv.scrollTop = resultDiv.scrollHeight;
  },
  status: function(message) {
    console.log(message);
    statusDiv.innerHTML = message;
  },
  onHeartRateRealTimeButton: function() {
    console.log('check onwwrbutton')
    var bytes = new Uint8Array(7);
    bytes[0] = 0xAB;
    bytes[1] = 0;
    bytes[2] = 4;
    bytes[3] = 0xFF;
    bytes[4] = 0x31;
    bytes[5] = 0X0A;
    bytes[6] = 1;
    ////0 --> close  1--> open
    function onDone(data) {

      var a = new Uint8Array(data);
      console.log(a)
      resultDiv.innerHTML = "heartRate :" + a[6] + "<br/>";
      resultDiv.scrollTop = resultDiv.scrollHeight;

      //console.log("Data : " + JSON.stringify(data))
    }

    function onError(err) {
      console.log("Error : " + err)
    }

    function onDone1(data) {

      console.log("Data : " + JSON.stringify(data))
    }
    ble.startNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
    setTimeout(() => {
      app.writeData(bytes.buffer, onDone1)
      setTimeout(closeFunction, 20000)

      function closeFunction() {
        bytes[0] = 0xAB;
        bytes[1] = 0;
        bytes[2] = 4;
        bytes[3] = 0xFF;
        bytes[4] = 0x31;
        bytes[5] = 0X0A;
        bytes[6] = 0;
				app.writeData(bytes.buffer, onDone1)


      }




    }, 1000)



  },
	onHeartRateButton: function() {
    console.log('check onwwrbutton')
    var bytes = new Uint8Array(7);
    bytes[0] = 0xAB;
    bytes[1] = 0;
    bytes[2] = 4;
    bytes[3] = 0xFF;
    bytes[4] = 0x31;
    bytes[5] = 0X09;
    bytes[6] = 1;
    ////0 --> close  1--> open
    function onDone(data) {

      var a = new Uint8Array(data);
      console.log(a)
      resultDiv.innerHTML = "heartRate :" + a[6] + "<br/>";
      resultDiv.scrollTop = resultDiv.scrollHeight;

      //console.log("Data : " + JSON.stringify(data))
    }

    function onError(err) {
      console.log("Error : " + err)
    }

    function onDone1(data) {

      console.log("Data : " + JSON.stringify(data))
    }
    ble.startNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
    setTimeout(() => {
      app.writeData(bytes.buffer, onDone1)
      setTimeout(closeFunction, 20000)

      function closeFunction() {
        bytes[0] = 0xAB;
        bytes[1] = 0;
        bytes[2] = 4;
        bytes[3] = 0xFF;
        bytes[4] = 0x31;
        bytes[5] = 0X09;
        bytes[6] = 0;
				app.writeData(bytes.buffer, onDone1)


      }




    }, 1000)



  },
  onBloodPressureButton: function() {
    console.log('check onwwrbutton')
    var bytes = new Uint8Array(7);
    bytes[0] = 0xAB;
    bytes[1] = 0;
    bytes[2] = 4;
    bytes[3] = 0xFF;
    bytes[4] = 0x31;
    bytes[5] = 0X21;
    bytes[6] = 1;
    ////0 --> close  1--> open
    function onDone(data) {

      var a = new Uint8Array(data);
      console.log(a)
      resultDiv.innerHTML = "Blood Pressure :" + a[6] + "<br/>";
      resultDiv.scrollTop = resultDiv.scrollHeight;

      //console.log("Data : " + JSON.stringify(data))
    }

    function onError(err) {
      console.log("Error : " + err)
    }

    function onDone1(data) {

      console.log("Data : " + JSON.stringify(data))
    }
    ble.startNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
    setTimeout(() => {
      app.writeData(bytes.buffer, onDone1)
      setTimeout(closeFunction, 60000)

      function closeFunction() {
        bytes[0] = 0xAB;
        bytes[1] = 0;
        bytes[2] = 4;
        bytes[3] = 0xFF;
        bytes[4] = 0x31;
        bytes[5] = 0X21;
        bytes[6] = 0;
        app.writeData(bytes.buffer, onDone1)


      }





    }, 1000)



  },
  onBloodOxygenButton: function() {
    console.log('check onwwrbutton')
    var bytes = new Uint8Array(7);
    bytes[0] = 0xAB;
    bytes[1] = 0;
    bytes[2] = 4;
    bytes[3] = 0xFF;
    bytes[4] = 0x31;
    bytes[5] = 0X11;
    bytes[6] = 1;
    ////0 --> close  1--> open
    function onDone(data) {

      var a = new Uint8Array(data);
      console.log(a)
      resultDiv.innerHTML = "Blood Oxygen :" + a[6] + "<br/>";
      resultDiv.scrollTop = resultDiv.scrollHeight;

      //console.log("Data : " + JSON.stringify(data))
    }

    function onError(err) {
      console.log("Error : " + err)
    }

    function onDone1(data) {

      console.log("Data : " + JSON.stringify(data))
    }
    ble.startNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, onDone, app.onError);
    setTimeout(() => {
      app.writeData(bytes.buffer, onDone1)
      setTimeout(closeFunction, 60000)

      function closeFunction() {
        bytes[0] = 0xAB;
        bytes[1] = 0;
        bytes[2] = 4;
        bytes[3] = 0xFF;
        bytes[4] = 0x31;
        bytes[5] = 0X11;
        bytes[6] = 0;
        app.writeData(bytes.buffer, onDone1)


      }




    }, 1000)



  },
  writeData: function(buffer, success, failure) { // to to be sent to MetaWear

    if (!success) {
      success = function(data) {
        console.log("success : ");
        resultDiv.innerHTML = resultDiv.innerHTML + "Sent: " + JSON.stringify(new Uint8Array(buffer)) + "<br/>";
        resultDiv.scrollTop = resultDiv.scrollHeight;
      };
    }

    if (!failure) {
      failure = app.onError;
    }

    ble.write(app.deviceId, metawear.serviceUUID, metawear.txCharacteristic, buffer, success, failure);
  },
  subscribeForIncomingData: function() {
    ble.startNotification(app.deviceId, metawear.serviceUUID, metawear.rxCharacteristic, app.onData, app.onError);
  },
  enableButtonFeedback: function(success, failure) {
    var data = new Uint8Array(6);
    data[0] = 0x01; // mechanical switch
    data[1] = 0x01; // switch state ops code
    data[2] = 0x01; // enable

    app.writeData(data.buffer, success, failure);
  },
  onMotorButton: function(event) {
    var pulseWidth = pulseWidthInput.value;
    var data = new Uint8Array(6);


    var bytes = new Uint8Array(6);
    bytes[0] = 0xAB;
    bytes[1] = 0;
    bytes[2] = 3;
    bytes[3] = 0xFF;
    bytes[4] = 0xB4;
    bytes[5] = 0x80;
    // Some magic bullshit

    app.writeData(bytes.buffer);
  },
  onVibrateButton: function(event) {
    var pulseWidth = pulseWidthInput.value;
    var data = new Uint8Array(6);


    var bytes = new Uint8Array(6);
    bytes[0] = 0xAB;
    bytes[1] = 0;
    bytes[2] = 3;
    bytes[3] = 0xFF;
    bytes[4] = 0x71;
    bytes[5] = 0x80;
    // Some magic bullshit

    app.writeData(bytes.buffer);
  },
  onBuzzerButton: function(event) {

    var bytes = new Uint8Array(6);
    bytes[0] = 0xAB;
    bytes[1] = 0;
    bytes[2] = 3;
    bytes[3] = 0xFF;
    bytes[4] = 0x91;
    bytes[5] = 0x80;

    app.writeData(bytes.buffer);
  },
  disconnect: function(event) {
    ble.disconnect(app.deviceId, app.showMainPage, app.onError);
    app.deviceId = "";
  },
  showMainPage: function() {
    mainPage.hidden = false;
    detailPage.hidden = true;
  },
  showDetailPage: function() {
    mainPage.hidden = true;
    detailPage.hidden = false;
    resultDiv.innerHTML = "<i>Press the button on the MetaWear</i><br/>";
  },
  onError: function(reason) {
    alert("ERROR: " + reason); // real apps should use notification.alert
  }
};
