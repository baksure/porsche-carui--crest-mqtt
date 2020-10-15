var {connect} = require("mqtt")
var match = require("mqtt-match")

export function MQTTClient(props) {
    //let clientID = props.clientID | ""
    console.log("clientMqtt", props.clientID);
    if (props.clientID == null) {
        props.clientID = "";
    }
    if (props.host == null) {
        try {
            props.host = window.globalSettings.mqttBroker.host;
        }
        catch (error) {
            props.host = window.location.hostname;
        }
    }
    if (props.portwebsockets == null) {
        try {
            props.portwebsockets = parseInt(window.globalSettings.mqttBroker.portwebsockets);
        }
        catch (error) {
            props.portwebsockets = 9000;
        }
    }
    console.log("[MQTTClient] will connect using ", props.clientID, props.portwebsockets, props.host);
    const client = connect({
        host: props.host,
        port: props.portwebsockets,
        clientId: props.clientID + "ReactClient_" + Math.random().toString(16).substr(2, 8),
        clean: true
    });
    console.log("...........[MQTTClient] new client:", props, client);
    let topicsList = [];
    let callbacks = {};
    client.on("connect", () => {
        console.log("[MQTTClient] connected.");
    });
    client.on("message", (topic, message) => {
        /* Find matching Topic References */
        let matchingTopics = [];
        for (const testTopic of topicsList) {
            if (match(testTopic, topic)) {
                matchingTopics.push(testTopic);
            }
        }
        /* Prase the message to JSON */
        let messageJSON = {};
        try {
            messageJSON = JSON.parse(message.toString("utf8"));
            /* if (!messageJSON.hasOwnProperty("value")) {
              console.error("[MQTTClient] message mallforemd! The payload does not have a 'value' property:", message)
              return
            } */
        }
        catch (error) {
            console.error("[MQTTClient] message mallforemd!", error);
            /* callbacks[topic]({
              topic: topic,
              payload: {
                error: "Parsing Error"
              },
              matchingTopicFilter: JSON.stringify(matchingTopics),
              error: error
            }) */
            return;
        }
        /* Exectute Callback */
        matchingTopics.forEach((matchedTopic) => {
            callbacks[matchedTopic]({
                topic: topic,
                payload: messageJSON,
                matchingTopicFilter: matchedTopic
            });
        });
    });
    return {
        instance: client,
        /**
         * subscribe - subscribe to <topic> an trigger callback.
         *
         * @param {String} topic - topic to subscribe.
         * @param {Function} callback - gets Called when new Data arrives .
         * @param {Object} options - optional subscription options, i.e.: {qos: 1}
         *
         * @example
         * mqtt.subscribe("weather/frankfurt/#",  (msg) => console.log(msg), {qos:1 });
         )
         */
        subscribe: (topic, callback, options) => {
            console.log(`MQTTClient]  subscribe to ${topic}`);
            if (callback) {
                callbacks[topic] = callback;
            }
            topicsList.push(topic);
            if (options) {
                client.subscribe(`${topic}`, options);
            }
            else {
                client.subscribe(`${topic}`);
            }
        },
        /**
         * publish - publish <message> to <topic>
         *
         * @param {String} topic - topic to publish to
         * @param {Object} message - message to publish as JS Object.
         * @param {Object} options - optionis like qos. eg: {qos: 1, retain: true}
         *
         * @example
         * mqtt.publish('car/clima', {temp: 10}, {qos: 1, retain: true})
         
         */
        publish: (topic, message, options) => {
            console.log("[MQTTClient]  publish", topic);
            let messageString;
            try {
                messageString = JSON.stringify(message);
            }
            catch (error) {
                console.log("[MQTTClient]  publish - can't stringify message", message);
                messageString = JSON.stringify({ error: "Can't stringify message" });
            }
            if (options) {
                client.publish(topic, messageString, options);
            }
            else {
                client.publish(topic, messageString);
            }
        },
        /**
         * unsubscribe a topic
         *
         * @param {String} topic - topic to subscribe.
         * @param {Function} callback - gets Called when new Data arrives .
         *
         * @example
         * mqtt.unsubscribe('car/clima', () => console.log("unsubscribed");
         )
         */
        unsubscribe: (topic, callback) => {
            try {
                client.unsubscribe(topic, () => {
                    console.log(console.log("[MQTTClient] unsubscribed: ", topic));
                    callback();
                });
                let newArray = topicsList.filter((item) => item !== topic);
                delete callbacks[topic];
                topicsList = [...newArray];
                console.log("[MQTTClient] removed callbacks for: ", topic);
            }
            catch (error) {
                console.error(console.log("[MQTTClient] could mot unsubscribe: ", topic));
            }
        }
    };
}
 