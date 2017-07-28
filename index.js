/* eslint-disable  func-names */
/*eslint no-magic-numbers: ["error", { "ignore": [1000] }]*/

'use strict';

var SmartObject = require('smartobject');
var process = require('child_process');
var exec = process.exec;
// initialize Resources that follow IPSO definition
var so = new SmartObject();

// initialize your Resources
// oid = 'temperature', iid = 0
var deviceId = 0;
so.init('status', deviceId, {
    'temperature': 0,
    'time': new Date().getTime()
});


var getCpuTemp = function () {
  exec("cat /sys/class/thermal/thermal_zone0/temp", function returnTemp (error, stdout, stderr) {
    if (error === null) {
      // You must send time (X axis) and a temperature value (Y axis)
      var date = new Date().getTime();
      var temp = parseFloat(stdout)/1000;

      // var so2 = cnode.getSmartObject();
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
      console.log('output: ' + date + ":" + temp);
      // socket.emit('temperatureUpdate', date, temp);
    } else {
      console.log('exec error: ' + error);
      console.log(stderr);
    }
  })
};

/** @this registered
* @returns {void}
*/
var registered = function() {
  var sobject = this.getSmartObject();
  var timeInterval = 5000;
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
exec("cat /sys/class/net/eth0/address", function (error, stdout, stderr) {
  if (error === null) {
    console.log(stdout);
    var nodeName = "";
    nodeName = String(stdout);
    // Instantiate a machine node with a client name and your smart object
    var cnode = new CoapNode(nodeName, so);

    cnode.on('registered', registered);

    cnode.on('offline', onOffline);

    cnode.on('reconnect', onReconnect);

    // register to a Server with its ip and port
    var port = 5683;
    cnode.register('192.168.0.151', port, function register (err, rsp) {
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
