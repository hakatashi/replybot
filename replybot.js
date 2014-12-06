var elasticsearch = require('elasticsearch');
var express = require('express');
var morgan = require('morgan');
var socketio = require('socket.io');
var seedrandom = require('seedrandom');
var sqlite3 = require('sqlite3');

var names = require('./names.json');

var client = new elasticsearch.Client({
	host: 'localhost:9200'
});

var db = new sqlite3.Database('log.sqlite3');
var io;

// chat process

function speak(name, text) {
	io.emit('chat', JSON.stringify({
		name: name,
		text: text
	}));
	db.run('INSERT INTO log VALUES($date, $name, $text)', {
		$date: Number(new Date()),
		$name: name,
		$text: text
	});
}

function ask(name, text) {
	client.search({
		index: 'tweet',
		type: 'reply',
		body: {
			query: {
				match: {
					dest: text
				}
			}
		}
	}, function (error, result) {
		if (error) return console.error(error);

		if (result.hits.total === 0) {
			client.search({
				index: 'tweet',
				type: 'reply',
				body: {
					query: {
						function_score: {
							functions: [
								{
									random_score: {
										seed: Math.random().toString()
									}
								}
							]
						}
					}
				}
			}, function (error, result) {
				if (error) return console.error(error);

				speak('bot', result.hits.hits[0]._source.reply + ' > ' + name);
			});
		} else {
			var hits = result.hits.hits;
			var choices = [];
			hits.forEach(function (hit, index) {
				if (hit._score > 2 || index < 3) choices.push(hit);
			});

			var scoreSum = 0;
			choices.forEach(function (choice) { scoreSum += choice._score; });

			var dice = Math.random() * scoreSum;
			var offset = 0;
			var selection;
			choices.some(function (choice) {
				offset += choice._score;
				if (dice < offset) {
					selection = choice;
					return true;
				} else return false;
			});

			speak('bot', selection._source.reply + ' > ' + name);
		}
	});
}

function getName(id) {
	return names[Math.floor(seedrandom(id)() * names.length)]
}

db.run('CREATE TABLE IF NOT EXISTS log (date INTEGER, name TEXT, text TEXT)', function () {
	// Launch web server

	var app = express();

	app.use(morgan('combined'));

	app.get('/chatlog', function (req, res, next) {
		db.all('SELECT name, text FROM log ORDER BY date DESC LIMIT 100', function (error, rows) {
			if (error) return console.error(error);
			res.json(rows.reverse());
		});
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

	io = socketio(server);

	io.on('connection', function (socket) {
		socket.on('chat', function (data) {
			speak(getName(socket.handshake.address), data);
			ask(getName(socket.handshake.address), data);
		});
	});
});
