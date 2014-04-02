var fs = require('fs'),
	request = require('supertest');
	serverAddress = 'http://localhost:3000';

describe('AxiomZen Music Recommendations Engine Test', function () {
	var file, followDataFilePath, listenDataFilePath, followData, listenData;

    var followDataFilePath = __dirname + '/data/follows.json';
    var listenDataFilePath = __dirname + '/data/listen.json';

    before(function () {
        file = fs.readFileSync(followDataFilePath, 'utf8');
        followData = JSON.parse(file);

        file = fs.readFileSync(listenDataFilePath, 'utf8');
        listenData = JSON.parse(file);
    })

    it('should not return any errors', function (done) {
        // feed follows.json to POST/follow endpoint

        var operationsList = followData['operations'];

        for (var i = 0; i < operationsList.length; i++) {
            // parse each from and to user ids
            var operation = operationsList[i];
            var fromUserId = operation[0];
            var toUserId = operation[1];
            var body = {'from': fromUserId, 'to': toUserId};

            request(serverAddress)
            	.post('/follow')
            	.send(body)
            	.expect(200)
            	.end(function (err, res) {
                	if (err) 
                		return done(err);
            	});
        }

         //feed listen.json to POST/listen endpoint 
        var userIds = listenData['userIds'];

        for (var id in userIds) {
            var musicList = userIds[id];

            for (var i = 0; i < musicList.length; i++) {
                var musicId = musicList[i];
                var body = {'user': id, 'music': musicId};

                request(serverAddress)
                .post('/listen')
                .send(body)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                });
            }
        }

        // GET/recommendations endpoint
        request(serverAddress)
        	.get('/recommendations')
        	.query({'user': 'a'})
        	.expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                console.log('Recommended Music for userId "a":');
                console.log(JSON.stringify(res.body, null, 3));
                done();
            });
		
    });
})