/*jslint node:true */
/*global require process console unescape rabbitUrl:true*/

var http = require('http');
var amqp = require('amqp');
var URL = require('url');
var htmlEscape = require('sanitizer/sanitizer').escape;

var messages = [];
var conn;

function unescapeFormData(msg) {
	return unescape(msg.replace('+', ' '));
}

// Cloud Foundry-specific
var port = process.env.VCAP_APP_PORT || 3000;
function rabbitUrl() {
	if (process.env.VCAP_SERVICES) {
		// Cloud Foundry-specific
		var conf = JSON.parse(process.env.VCAP_SERVICES);
		return conf['rabbitmq-2.4'][0].credentials.url;
	} else {
		return "amqp://localhost";
	}
}

console.log("Starting ... AMQP URL: " + rabbitUrl());
// create connection
conn = amqp.createConnection({
	url: rabbitUrl()
});

// Create Web server using Rabbit message exchange
function httpServer(exchange) {
	var serv = http.createServer(function(req, res) {
		var url = URL.parse(req.url);
		if (req.method === 'GET' && url.pathname === '/') {
		
			// serve main page
			res.statusCode = 200;
			res.write('<html><head><title>Message producer</title></head><body>\n' +
					  '<h2>Click to send a message</h2>\n' +
					  '<form method="post">\n' +
					  '<input name="data"/><input type="submit"/>' +
					  '</form>\n' +
					  '<ol>');
			// write messages
			for (var i = 0; i < messages.length; i++) {
				res.write('<li>' + messages[i] + '</li>');
			}
			res.end("</ol></body></html>");
			
			
		} else if (req.method === 'POST' && url.pathname === '/') {
		
			// someone clicked on the submit button
			// post a message to the exchange
			var chunks = '';

			// wait for all message chunks to come in
			req.on('data', function(chunk) {
				chunks += chunk;
			});
			
			// when finished, push message to exchange
			req.on('end', function() {
				var msg = unescapeFormData(chunks.split('=')[1]);

				// TODO Posting to exchange
				
				// all is good redirect back to home
				res.statusCode = 303;
				res.setHeader('Location', '/');
				res.end();
			});
			
		} else {
			res.statusCode = 404;
			res.end("This is not the page you were looking for.");
		}
	});
	serv.listen(port);
}

function setup() {

	// create exchange
	var exchange = conn.exchange('cf-exchange', {
		// send message to all subscribers
		type: 'fanout',
		durable: false
	}, function() {
		// TODO 1. create the queue and subscribe to it
	});
}
conn.on('ready', setup);
