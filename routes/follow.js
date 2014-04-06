/*
    This route defines the POST/follow endpoint. 
*/
var db = require('../models/db_operations.js');
var follow;
var followUser;
var userRegistry = require('../models/users_registry.js');
var validation = require('../utils/input-validator.js');

//the endpoint for the POST request
followUser = function(req, res) {
        var from = req.body.from, to = req.body.to;
        if (!validation.checkInput(from, 'userID') || !validation.checkInput(to, 'userID'))
            res.send(403, 'Forbidden user format');

        follow(from, to, function() { 
            res.send(200);
        });
}

// registering the follow relationship between 2 users to the user registry and database
follow = function (from_userID, to_userID, callback) {
    var fromUser, toUser;
    userRegistry.getUser(from_userID, registerFollowee);
    userRegistry.getUser(to_userID, registerFollowee);
    
    function registerFollowee (user) {
        if (user.userId === from_userID)
            fromUser = user;
        else if (user.userId === to_userID)
            toUser = user;

        if (fromUser && toUser) {
            fromUser.addFollowee(to_userID);
            db.addToArrayInDB(from_userID, 'followees', to_userID);
            callback();
        }
    }        
}

module.exports.followUser = followUser;