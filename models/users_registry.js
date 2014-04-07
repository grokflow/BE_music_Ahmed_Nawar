/*
    This file defines an interface to the User Registry, which is an in-memory table for all the users currently loaded to memory.
    It defines functions that are responsible for creating user records, adding them to the registry, fetching records from db if needed. 
    Moreover, it defines various prototype methods for the UserRecord object.

    When a user is requested through getUser(), the registry is consulted first and if it doesn't exist, a request is sent to the db. 
    Since the db will create a user record if the user doesn't exist in the db, multiple getUser() requests for the same user could lead to a problem.
    For a given user x that doesn't exist in the db, multiple getUser() requests can lead the db to issue commands to create mutliple documents for the same user.
    Since userIds are unique, only one document will be created and the data associated with this user (e.g. listened to a new song) will be lost.
    Therefore, the concept of the Callback Scheduler was introduced, which is a table where the key is a userId and the value is a queue of callbacks.
    If the getUser request needs to be fulfilled from the database, this table is consulted first. If an earlier request for the same user was issued for the
    db but still pending, the calling function will add its callback to the queue. When the db responds, all the callbacks associated with this user
    are called. This will prevent unnecessary excessive calls to the db and more importantly prevent loss of data as mentioned previously. 
*/
var addUser;
var createUser;
var db = require('./db_operations.js');
var getUser;
var usersRegistry = {};
var callbackScheduler = {};
var Queue = require('../utils/queue.src.js').Queue;

function UserRecord(user_id) {
    this.userId = user_id;
    this.dbId = undefined;
    this.totalSongsPlayed = 0;
    this.listenedTo = {};
    this.musicGenres = {};
    this.followees = [];
}

UserRecord.prototype.hasListenedTo = function(music_title) {
    return this.listenedTo.hasOwnProperty(music_title);
}

UserRecord.prototype.isListeningTo = function(music_title) {
    this.listenedTo[music_title] = 1;
    this.totalSongsPlayed++;
}

UserRecord.prototype.getPlayCountOf = function(music_title) {
    return this.listenedTo[music_title];
}

UserRecord.prototype.incrementPlayCountOf = function(music_title) {
    this.listenedTo[music_title]++;
}

UserRecord.prototype.getTotalSongsPlayed = function() {
    return this.totalSongsPlayed;
}
UserRecord.prototype.addGenre= function(genre) {
    this.musicGenres[genre] = 1;
}

UserRecord.prototype.hasMusicGenre = function(genre) {
    return this.musicGenres.hasOwnProperty(genre);
}

UserRecord.prototype.getGenreCountOf = function(genre) {
    return this.musicGenres[genre];
}

UserRecord.prototype.incrementGenreCountOf = function(genre) {
    this.musicGenres[genre]++;
}

UserRecord.prototype.addFollowee = function(followee_id) {
    this.followees.push(followee_id);
}

UserRecord.prototype.getFolloweesCount = function() {
    return this.followees.length;
}

// compiles a lists with all the songs listened to by followees.
// The list is organized as a table where they key is the music title and the value is number of followees who listened to this song previously.
UserRecord.prototype.discoverFolloweesMusic = function(callback) {
    var followeesMusicList = {}, followeesCount = remainingFollowees = this.followees.length;
    var thisUser = this; // the 'this' variable will not be not accessible in 'compileFolloweesMusicList' function because in JavaScript
    // the 'this' variable is always specific to a particular function invocation, so I am saving it locally to use it later in the closure
    
    if (followeesCount == 0)
        callback(this, {});

    for (var i = 0; i < followeesCount; i++) {
        var followeeId = this.followees[i];
        getUser(followeeId, compileFolloweesMusicList);
    }

    function compileFolloweesMusicList(current_followee) {
        var musicCollection = current_followee.listenedTo;
        remainingFollowees--;
        
        for (var music in musicCollection) {
            if (musicCollection.hasOwnProperty(music)) {
                if (thisUser.hasListenedTo(music) === false) {
                    var ml = followeesMusicList;
                    ml[music] = isNaN(ml[music]) ? 0 : ml[music];
                    followeesMusicList[music] = ml[music] + 1;
                }
            }
        }

        if (remainingFollowees === 0)
            callback(thisUser, followeesMusicList);
    }

}

getUser = function(user_id, callback) {
    
    if (usersRegistry.hasOwnProperty(user_id)) {        //user is already loaded in memory
        callback(usersRegistry[user_id]);
        return;
    }

    if (callbackScheduler.hasOwnProperty(user_id)) {     // pending db respnonse for the same user
        callbackScheduler[user_id].enqueue(callback);
    } else { 
        //first request to db for this user
        callbackScheduler[user_id] = new Queue();
        callbackScheduler[user_id].enqueue(callback);
        db.getFromDB(user_id, manageCallbacks);
    }

    function manageCallbacks(new_user) {
        var queue = callbackScheduler[user_id];
        while (!queue.isEmpty()) {
            //processing all callbacks
            var func = queue.dequeue();
            func(new_user);
        }
        //delete the entry to signal no pending requests
        delete callbackScheduler[user_id];
    }
}

addUser = function(user_id, record_details) {
    usersRegistry[user_id] = record_details;
}

createUser = function(user_id, callback) {
    var newUserRecord = new UserRecord(user_id);

    addUser(user_id, newUserRecord);
    db.createUserDocument(user_id, callback);
}

module.exports.UserRecord = UserRecord;
module.exports.addUser = addUser;
module.exports.getUser = getUser;
module.exports.createUser = createUser;