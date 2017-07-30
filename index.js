/* eslint-disable  func-names */
/*eslint no-magic-numbers: ["error", { "ignore": [1000, 200] }]*/

'use strict';

var SmartObject = require('smartobject');
var process = require('child_process');
var request = require('request');
var exec = process.exec;
var lwm2mHost = "192.168.0.151";
var lwm2mPort = 5683;
// initialize Resources that follow IPSO definition
var so = new SmartObject();

var deviceId = 0;
so.init('status', deviceId, {
    'temperature': 0,
    'time': new Date().getTime(),
    'serverMessage': 'OK'
});

/** @this registered
* @param {String} msg alert message
* Send alert text to node-RED for audible notification
* @returns {void}
*/
var sendAlert = function(msg) {
  var url = "http://localhost:1880/alert";
  request(
    {
      'method': 'POST',
    'uri': url,
    'body': {'text': msg},
    'json': true,
    }
  , function (error, response, body) {
      if (response.statusCode === 200) {
        console.log('OK')
      } else {
        console.log('error: '+ response.statusCode)
        console.log(body)
      }
    }
  );
}

var getCpuTemp = function () {
  exec("cat /sys/class/thermal/thermal_zone0/temp", function returnTemp (error, stdout, stderr) {
    var msg = so.get('status', deviceId, 'serverMessage');
    console.log(msg);
    if (msg !== 'OK') {
      sendAlert(msg);
    }
    if (error === null) {
      var temp = parseFloat(stdout)/1000;

      so.write('status', deviceId, 'temperature', temp, function (err, data) {
        if (err) {
          console.log(err);
        }
          console.log(data);
      });
      so.write('status', deviceId, 'time', new Date().getTime(), function (err, data) {
        if (err) {
          console.log(err);
        }
          console.log(data);
      });
      console.log('output: ' + temp);
    } else {
      console.log(stderr);
    }
  })
};

/** @this registered
* @returns {void}
*/
var registered = function() {
  var sobject = this.getSmartObject();
  var timeInterval = 8000;
  console.log(sobject);
  setInterval(getCpuTemp, timeInterval);
};

var onOffline = function() {
  console.log("i lost my server");
}

var onReconnect = function() {
  console.log("reconnect to server");
}

var CoapNode = require('coap-node');
// Get mac address for unique ID
exec("cat /sys/class/net/eth0/address", function (error, stdout, stderr) {
  if (error === null) {
    var nodeName = String(stdout);
    // Instantiate a machine node with a client name and your smart object
    var cnode = new CoapNode(nodeName, so);

    cnode.on('registered', registered);

    cnode.on('offline', onOffline);

    cnode.on('reconnect', onReconnect);

    // register to a Server with its ip and port
    cnode.register(lwm2mHost, lwm2mPort, function register (err, rsp) {
        console.log(rsp);      // { status: '2.05' }
        if (err) {
          console.log(err);
        }
    });
  } else {
    console.log('exec error: ' + error);
    console.log(stderr);
  }
});
