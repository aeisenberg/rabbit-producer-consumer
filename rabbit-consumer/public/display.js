/*jslint browser:true */
/*global $ window SockJS console */
$(document).ready(function() {

	var ws = new SockJS("/msg");
	ws.onmessage = function(evt) {
		$('#messages').append('<li>' + evt.data + "</li>");
	};
});
