/*
    This route defines the POST /follow endpoint. 
*/
var follow;
var followUser;
var User = require('../models/user.js').User;
var validation = require('../utils/input-validator.js');

// POST /follow endpoint handler
followUser = function(req, res) {
        var from = req.body.from, to = req.body.to;
        if (!validation.checkInput(from, 'userID') || !validation.checkInput(to, 'userID'))
            res.send(403, 'Forbidden user format');

        follow(from, to, function(err) {
            if (err) res.send(500, err); 
            res.send(200);
        });
}

// registering the follow relationship between 2 users to the user registry and database
follow = function (from_userID, to_userID, followRequestDone) {
    var fromUser, toUser;
    User.getUser(from_userID, registerFollowee);
    User.getUser(to_userID, registerFollowee);
    
    function registerFollowee (current_user) {
        if (current_user.userId === from_userID)
            fromUser = current_user;
        else if (current_user.userId === to_userID)
            toUser = current_user;

        if (fromUser && toUser) {
            fromUser.addFollowee(to_userID, followRequestDone);
        }
    }        
}

module.exports.followUser = followUser;