var	db = require('./models/db_operations.js');
var	http = require('http');
var	routes = require('./routes');
var express = require('express');
var	app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);


app.post('/listen', routes.listen.listenToMusic);
app.post('/follow', routes.follow.followUser);
app.get('/recommendations', routes.recommendationEngine.recommendMusic);


var startServer = function (err) {
	if (err) {
		console.log('Error: unable to start server, database issue: ', err);
		console.log('Exiting Now :(');
		process.exit(1);
	}
    app.server = http.createServer(app);
    app.server.listen(app.get('port'), function() {
  		console.log('Express server listening on port ' + app.get('port'));
	});
}

//start the server after connecting to the database server
db.openDB('AxiomZenDB', startServer);
module.exports = app;  
