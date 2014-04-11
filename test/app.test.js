var async = require('async');
var fs = require('fs');
var request = require('supertest');
var serverAddress = 'http://localhost:3000';

describe('AxiomZen Music Recommendations Engine Test', function () {
    var file, listenObj, followData = [], listenData = [];
    var followDataFilePath = __dirname + '/data/follows.json';
    var listenDataFilePath = __dirname + '/data/listen.json';

    before(function() {
        file = fs.readFileSync(followDataFilePath, 'utf8');
        followData = JSON.parse(file).operations;

        file = fs.readFileSync(listenDataFilePath, 'utf8');
        listenObj = JSON.parse(file).userIds;

        // convert listen data to an array of request bodies for simple iteration using async
        for (var id in listenObj) {
            if (listenObj.hasOwnProperty(id)) {
                for (var i = 0; i < listenObj[id].length; i++)
                    listenData.push({'user': id, 'music': listenObj[id][i]});
            }
        }
    });

    it('should not return any errors', function (done) {
        async.parallel([feedFollowData, feedListenData], recommend);

        // feed follows.json to POST/follow endpoint
        function feedFollowData(callback) {
            async.each(followData, function (operation, followRequestDone) {
                // parse from and to user ids
                var fromUserId = operation[0];
                var toUserId = operation[1];
                var body = {'from': fromUserId, 'to': toUserId};
            
                request(serverAddress)
                .post('/follow')
                .send(body)
                .expect(200)
                .end(function (err, res) {
                    if (err) followRequestDone(err);
                    else followRequestDone(null);
                });
            }, callback);
        }
        
         //feed listen.json to POST/listen endpoint 
        function feedListenData(callback) {
            async.each(listenData, function (body, listenRequestDone) {
                request(serverAddress)
                .post('/listen')
                .send(body)
                .expect(200)
                .end(function (err, res) {
                    if (err) listenRequestDone(err);
                    else listenRequestDone(null);

                });
            }, callback);
        }
    
        // GET/recommendations endpoint
        function recommend(err, results) {
            if (err) return done(err);
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
        }
    });
});
