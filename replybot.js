var elasticsearch = require('elasticsearch');
var express = require('express');
var morgan = require('morgan');
var socketio = require('socket.io');

var client = new elasticsearch.Client({
	host: 'localhost:9200'
});

// chat process

var chatlog = [];

function speak(name, text) {
	io.emit('chat', JSON.stringify({
		name: name,
		text: text
	}));
	chatlog.push({name: name, text: text});
}

function ask(name, text) {

}

// Launch web server

var app = express();

app.use(morgan('combined'));

app.get('/chatlog', function (req, res, next) {
	res.json(chatlog);
});

app.use(express.static(__dirname));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	res.sendFile(__dirname + '/404.html');
});

// error handler
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: err
	});
});

var server = app.listen(10724, function () {
	console.log('Express server listening on port ' + server.address().port);
});

// WebSocket Configuration

var io = socketio(server);

io.on('connection', function (socket) {
	console.log('connected');
	socket.on('chat', function (data) {
		speak('someone', data);
		ask('soneone', data);
	});
});

setInterval(function () {
	speak('test', new Date().toString());
}, 3000);
