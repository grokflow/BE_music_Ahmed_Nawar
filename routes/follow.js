var userRegistry = require('../models/users_registry.js'),
    db = require('../models/db_operations.js'),
    followUser
    ;

    followUser = function(req, res) {
        var from = req.body.from, to = req.body.to;

        var err = follow(from, to);
    //WRONG, need a callback if i were to return errors 
    if (err) res.send(err);
    else res.send(200);

}

follow = function (from_userID, to_userID) {
    var fromUser = userRegistry.getUser(from_userID);
    var toUser =  userRegistry.getUser(to_userID);
    if (fromUser && toUser) {
        registerFollowee(fromUser);
        return;
    }
    
    if (fromUser === undefined) {
        db.getFromDB(from_userID, registerFollowee);
    } else {
        registerFollowee(fromUser);
    }
    if (toUser === undefined) {
        db.getFromDB(to_userID, registerFollowee);
    } else {
        registerFollowee(toUser);
    }

    function registerFollowee (user)  {
        if (user.userId === from_userID)
            fromUser = user;
        else if (user.userId === to_userID)
            toUser = user;

        if (fromUser && toUser) {
            console.log("callback", fromUser, toUser);
            fromUser.addFollowee(to_userID);
            db.addToArrayInDB(from_userID, 'followees', to_userID);
        }
    }        
}

module.exports.followUser = followUser;