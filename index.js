// var MQTTClient = require("./mqttConnector")

// var mqtt = MQTTClient({
//   clientID: "converter",
//   host:"localhost",
//   port:"9000"
// })

var mqtt = require("mqtt");
var client = mqtt.connect({
  host: "localhost",
  // portwebsockets: 9000,
  // portnative:1883,
  port: 1883,
  wsOptions: {},
  clientId: "converter",
  clean: true,
});
var Request = require("request");
var carData;

client.on("connect", function () {
  console.log("connected");
  setInterval(readCar, 100); //time is in ms
});

function readCar() {
  Request.get("http://localhost:8080/crest/v1/api", (error, response, body) => {
    if (error) {
      return console.dir(error);
    }
    carData = JSON.parse(body);

    let speedKmh = carData.carState.mSpeed * 3.6;
    speedKmh = Math.floor(speedKmh)
    let gear = carData.carState.mGear
    let rpm = carData.carState.mRpm
    let power = carData.carState.mThrottle * 80
    client.publish("pnc/car/generalData/speed", JSON.stringify({ "value": speedKmh }));
    client.publish("pnc/car/generalData/gear", JSON.stringify({ "value": gear }));
    client.publish("pnc/car/generalData/rpm", JSON.stringify({ "value": rpm }));
    client.publish("pnc/car/generalData/powerMeter", JSON.stringify({ "value": power }));
    console.dir(speedKmh);
  });
}
