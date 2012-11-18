/*global require console __dirname process */
/*jslint node:true es5:true */

var WebSocketServer = require('ws').Server, 
	http = require('http'),
	express = require('express'),
	amqp = require('amqp'),
	htmlEscape = require('sanitizer/sanitizer').escape,
	sockjs = require('sockjs');
	
var path = process.env.PWD + '/public';
// use express module as a static file server
var app = express();

// use sockjs library to ensure compatibility across broswers and servers w/o websocket support
var wsServer = sockjs.createServer({ jsessionid: true });
var server = http.createServer(app);

app.configure(function() {
	app.use(app.router);
	app.use(express.static(path));
	app.use(express.directory(path));
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
	wsServer.installHandlers(server, { prefix: '/msg' });
});

// Cloud Foundry-specific
server.listen(process.env.VCAP_APP_PORT || 8083);
function rabbitUrl() {
	if (process.env.VCAP_SERVICES) {
		// Cloud Foundry-specific
		var conf = JSON.parse(process.env.VCAP_SERVICES);
		return conf['rabbitmq-2.4'][0].credentials.url;
	} else {
		return "amqp://localhost";
	}
}

///////////////
// Socket stuff
///////////////
var socketConns = [];
function addSocketConn(ws) {
	socketConns.push(ws);
}
function removeSocketConn(ws) {
	for (var i = 0; i < socketConns.length; i++) {
		if (socketConns[i] === ws) {
			socketConns.slice(i, 1);
		}
	}
}

function writeMessage(msg) {
	for (var i = 0; i < socketConns.length; i++) {
		// send the message to the client over the socket
		socketConns[i].write(htmlEscape(msg.body));
	}
}

// listen for new socket connections
wsServer.on('connection', function(ws) {
	console.log('WS connection received: %s.', JSON.stringify(ws.address));
	addSocketConn(ws);
	ws.on('close', function() {
		removeSocketConn(ws);
	});
});


///////////////
// Queue stuff
///////////////

console.log("Starting ... AMQP URL: " + rabbitUrl());
// create a new connection
/** @type Stream */
var conn = amqp.createConnection({
	url: rabbitUrl()
});

function setup() {
	var exchange = conn.exchange('cf-exchange', {
		'type': 'fanout',
		durable: false
	}, function() {
		var queue = conn.queue('cf-queue', {
			durable: false
		}, function() {
			queue.subscribe(function(msg) {
				// pass the message from the queue to the clients
				// through the websockets
				writeMessage(msg);
			});
			queue.bind(exchange.name, 'cf-queue');
		});
	});
}
conn.on('ready', setup);
