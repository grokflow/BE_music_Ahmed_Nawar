var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var db = require('./models/db_operations.js');
var userRegistry = require('./models/users_registry.js');
var app = express();


// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);


app.post('/listen', routes.listen.listenToMusic);


/*app.post('/follow', function(req, res) {
	var b = req.body;
	var from = b.from, to = b.to;
	mydata.followUser(from, to);
	res.send(200);

});

app.get('/recommendations:user', function (req, res) {
	var user = req.params.user;
	var arr = mydata.recommendMusic(user);
	res.setHeader('Content-Type', 'application/json');
	var s = {"list":  arr};
	var str = JSON.stringify(s);
	console.log(str);
	res.end(str);
})
*/

var startServer = function () {
	app.server = http.createServer(app);
	app.server.listen(3000);
}

db.openDB('axiomZen', startServer);
