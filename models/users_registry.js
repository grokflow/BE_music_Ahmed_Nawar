var usersRegistry = {},
	db = require('./db_operations.js')
	;


function UserRecord(user_id) {
    this.userId = user_id;
    this.dbId = undefined;
    this.totalTagCount = 0;
    this.listenedTo = {};
    this.musicTags = {};
    this.followees = [];

}

UserRecord.prototype.hasListenedTo = function(music_title) {
    return this.listenedTo.hasOwnProperty(music_title);
}

UserRecord.prototype.getPlayCountOf = function(music_title) {
    return this.listenedTo[music_title];
}

UserRecord.prototype.incrementPlayCountOf = function(music_title) {
    this.listenedTo[music_title]++;
}

UserRecord.prototype.isListeningTo = function(music_title) {
    this.listenedTo[music_title] = 1;
}

UserRecord.prototype.hasMusicTag = function(tag) {
    return this.musicTags.hasOwnProperty(tag);
}

UserRecord.prototype.getTagCountOf = function(tag) {
    return this.musicTags[tag];
}

UserRecord.prototype.incrementTagCountOf = function(tag) {
    this.musicTags[tag]++;
    this.totalTagCount++;
}

UserRecord.prototype.addTag = function(tag) {
    this.musicTags[tag] = 1;
    this.totalTagCount++;
}

UserRecord.prototype.getTotalTagCount = function() {
    return this.totalTagCount;
}

UserRecord.prototype.addFollowee = function(followee_id) {
    this.followees.push(followee_id);
}

UserRecord.prototype.discoverFolloweesMusic = function(callback) {

    var followeesMusicList = {}, followeesCount = remainingFollowees = this.followees.length,
        thisUser = this;

    if (followeesCount == 0)
        callback(this, {});

        console.log("remaining", remainingFollowees);

    for (var i = 0; i < followeesCount; i++) {
        var followeeId = this.followees[i];
        var followee = getUser(followeeId);
        if (followee === undefined) {
            db.getFromDB(followeeId, compileFolloweesMusicList);
        } else {
            compileFolloweesMusicList(followee)
        }

    }
    function compileFolloweesMusicList(current_followee) {
        console.log("remaining", remainingFollowees);
        remainingFollowees--;
        var musicCollection = current_followee.listenedTo;
        
        for (var music in  musicCollection) {
            if (musicCollection.hasOwnProperty(music)) {
                if (thisUser.hasListenedTo(music) === false)
                    followeesMusicList[music] = true;
            }
        }

        if (remainingFollowees === 0)
            callback(thisUser, followeesMusicList);
    }

}
getUser = function(user_id) {
    console.log("getUserFromRegistry", user_id);

    return usersRegistry[user_id];
}

addUser = function(user_id, record_details) {
    console.log("addUserToRegistry", user_id, record_details);

    usersRegistry[user_id] = record_details;
}

createUser = function(user_id, callback) {
    var newUserRecord = new UserRecord(user_id);
    addUser(user_id, newUserRecord);
    db.createUserDocument(user_id, callback);

    console.log("createUser", user_id);  
}


module.exports.UserRecord = UserRecord;
module.exports.addUser = addUser;
module.exports.getUser = getUser;
module.exports.createUser = createUser;
