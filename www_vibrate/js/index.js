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

function bin2string(array){
	var result = "";
	for(var i = 0; i < array.length; ++i){
		result+= (String.fromCharCode(array[i]));
	}
	return result;
}
var dog=[];
var bow_bow=[];

// ASCII only

function byte2string(data)
{
  const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
  var count = data.length;
  var str = "";

  for (var index = 0;index < count;)
  {
    var ch = data[index++];
    if (ch & 0x80)
    {
      var extra = extraByteMap[(ch >> 3) & 0x07];
      if (!(ch & 0x40) || !extra || ((index + extra) > count))
        return null;

      ch = ch & (0x3F >> extra);
      for (;extra > 0;extra -= 1)
      {
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
    rxCharacteristic: "6e400003-b5a3-f393-e0a9-e50e24dcca9e"  // receive is from the phone's perspective
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

        var onConnect = function() {
            app.enableButtonFeedback(app.subscribeForIncomingData, app.onError);
            app.showDetailPage();
        };

        ble.connect(app.deviceId, onConnect, app.onError);
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
    writeData: function(buffer, success, failure) { // to to be sent to MetaWear

        if (!success) {
            success = function() {
                console.log("success");
                resultDiv.innerHTML = resultDiv.innerHTML + "Sent: " + JSON.stringify(new Uint8Array(buffer)) + "<br/>";
                resultDiv.scrollTop = resultDiv.scrollHeight;
            };
        }

        if (!failure) {
            failure = app.onError;
        }

        ble.writeCommand(app.deviceId, metawear.serviceUUID, metawear.txCharacteristic, buffer, success, failure);
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


var bytes= new Uint8Array(6);
        bytes[0] = 0xAB;
        bytes[1] = 0;
        bytes[2] = 3;
        bytes[3] = 0xFF;
        bytes[4] = 0x71;
        bytes[5] = 0x80;
      // Some magic bullshit

        app.writeData(bytes.buffer);
    },
		onVibrateButton:function(event) {
        var pulseWidth = pulseWidthInput.value;
        var data = new Uint8Array(6);


var bytes= new Uint8Array(6);
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
        bytes[0] =  0xAB;
        bytes[1] =  0;
        bytes[2] = 3;
        bytes[3] =  0xFF;
        bytes[4] = 0x91;
        bytes[5] =  0x80;

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
