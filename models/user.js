/*
    This file defines a mongoose user scheme along with instance and static functions to handle adding followees, listening to music
    and updating the user's genres info.  

    When a user is requested through getUser(), a request is sent to the db. 
    Since the db will create a user record if the user doesn't exist in the db, multiple getUser() requests for the same user could lead to a problem.
    For a given user x that doesn't exist in the db, multiple getUser() requests can lead the db to issue commands to create mutliple documents for the same user.
    Since userIds are unique, only one document will be created and the data associated with this user (e.g. listened to a new song) will be lost.
    Therefore, the concept of the Callback Scheduler was introduced, which is a table where the key is a userId and the value is a queue of callbacks.
    If the getUser request needs to be fulfilled from the database, this table is consulted first. If an earlier request for the same user was issued for the
    db but still pending, the calling function will add its callback to the queue. When the db responds, all the callbacks associated with this user
    are called. This will prevent unnecessary excessive calls to the db and more importantly prevent loss of data as mentioned previously. 
*/
var async = require('async');

var callbackScheduler = {};
var Queue = require('../utils/queue.src.js').Queue;
var mongoose = require('mongoose');

userSchema = new mongoose.Schema({
    userId     :    { type : String, unique : true  },
    listenedTo :    [{ key : String, value : Number }],
    musicGenres:    [{ key : String, value : Number }],
    followees  :    [String]
});

userSchema.methods.addFollowee = function(followee_id, callback) {
    this.followees.addToSet(followee_id);
    this.save(function (err) {
        if (err) {
            console.log ("Error on save! ", err);
            callback(err);
        } else {
            callback(null);
        }
    });
}

userSchema.methods.getFolloweesCount = function() {
    return this.followees.length;
}

userSchema.methods.isListeningTo = function(music_title, callback) {
    upsertRecord(this._id, 'listenedTo', music_title, 1, callback);
}

userSchema.methods.addGenre = function(genre, callback) {
    upsertRecord(this._id, 'musicGenres', genre, 1, callback);
}

userSchema.statics.getUser = function(user_id, callback) {
    if (callbackScheduler.hasOwnProperty(user_id)) {     // pending db respnonse for the same user
        callbackScheduler[user_id].enqueue(callback);
    } else { 
        //first request to db for this user
        callbackScheduler[user_id] = new Queue();
        callbackScheduler[user_id].enqueue(callback);
        fetchUserDocument(user_id, manageCallbacks);
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

// compiles the user's music list, followees music list and user's genres list to be used 
// for recommendation. 
userSchema.methods.compileLists = function(list_compiled) {
    var ownMusicList = {}, followeesMusicList = {}, ownGenresList = {};
    var followeesCount = this.getFolloweesCount();
    ownMusicList['totalSongsPlayed'] = 0;

    for (var i = 0; i < this.listenedTo.length; ++i) {
        ownMusicList[this.listenedTo[i].key] = this.listenedTo[i].value;
        ownMusicList['totalSongsPlayed']++;
    }

    for (var i = 0; i < this.musicGenres.length; ++i) {
        ownGenresList[this.musicGenres[i].key] = this.musicGenres[i].value;
    }

    async.eachSeries(this.followees, function (followee_id, callback) {
        userDocument.getUser(followee_id, function (followee) {
            for (var i = 0; i < followee.listenedTo.length; ++i) {
                var song = followee.listenedTo[i].key;
                var ml = followeesMusicList;
                ml[song] = (isNaN(ml[song]) ? 0 : ml[song]);
                followeesMusicList[song]++;
            }
            callback(null);
        });
    }, function(){
        list_compiled(ownMusicList, followeesMusicList, ownGenresList, followeesCount);
    });
}

/********************** HELPER FUNCTIONS **********************/
function createUserDocument(user_id, callback) {
    var newUserDocument = new userDocument({ userId: user_id });
    newUserDocument.save(function (err) {
        if (err) console.log ("Error on save! ", err);
        callback(newUserDocument);
    });
}

function fetchUserDocument(user_id, callback) {
    userDocument.findOne({ userId: user_id }, function (err, current_user) {
        if (err) console.log("Error: getFromDB, ", err);

        if (!current_user) { //not in db, create user
            createUserDocument(user_id, callback);
        } else { //load to memory from db
            callback(current_user);
        }
    });
}

// Inserts a subdocument {key, value} to a user document. The subdocument is added to an existing array of subdocuments 
function insertRecord(doc_id, field, key, value, callback) {
    var updateObject = {};
    //the update query is created as an object because if embedded directly in the update call, the variables will be treated as literals
    //if field was passed as 'musicList', it will search for field 'field' not 'musicList'
    updateObject[field] = { 'key': key, 'value': value };

    userDocument.update({ _id: doc_id }, { $push: updateObject }, function (err, affected_users) {
        if (err) console.log("Error: insertRecordInDB, ", err);
        callback(null);
    });    
}

// increments an exisiting subdocument, if it doesn't exist a new subdocument in inserted 
function upsertRecord(doc_id, field, key, increment, callback) {
    var queryObject = {}, updateObject = {};
    queryObject._id = doc_id;
    queryObject[field + '.key'] = key;

    //the positional $ operator acts as a placeholder for the first element that matches the query
    updateObject[field + '.$.value'] = increment;

    userDocument.update(queryObject, { $inc: updateObject }, function (err, affected_users) {
        if (err) console.log("Error: updateRecordInDB, ", err);
        if (affected_users === 0) { //doesn't exist, insert a new one
            insertRecord(doc_id, field, key, increment, callback);
        } else {
            callback(null);
        }
    });    
}


userDocument = mongoose.model('users', userSchema);
exports.User = userDocument;