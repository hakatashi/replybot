var socket = io();

function refresh() {
	$.get('/chatlog').done(function (data) {
		$('#log').empty();
		data.forEach(function (row) {
			onChat(row);
		});
	});
	scroll();
}

function onChat(data) {
	var $row = $('<tr/>');
	$row.append($('<th/>', {
		text: data.name
	}));
	$row.append($('<td/>', {
		text: data.text
	}));
	$('#log').append($row);
}

function scroll() {
	$('#logspace').animate({
		scrollTop: $('#log').height()
	}, 'slow');
}

$('#input').keypress(function (event) {
	if (event.which === 13) {
		socket.emit('chat', $(this).val());
		$(this).val('');
		return false;
	}
});

socket.on('chat', function (text) {
	var data = JSON.parse(text);
	onChat(data);
	scroll();
});

$(document).ready(function () {
	$('#input').focus();
	refresh();
})
