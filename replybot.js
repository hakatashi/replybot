var elasticsearch = require('elasticsearch');
var express = require('express');
var client = new elasticsearch.Client({
	host: 'localhost:9200'
});

// Launch web server

var app = express();

app.use(morgan('combined'));
app.use(express.static(__dirname));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
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
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
});
