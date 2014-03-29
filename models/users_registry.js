var usersRegistry = {},
	db = require('./db_operations.js')
	;


function UserRecord(user_id) {
    this.userId = user_id;
    this.dbId = undefined;
    this.listenedTo = {};
    this.musicTags = {};
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

UserRecord.prototype.hasMusicTag= function(tag) {
    return this.musicTags.hasOwnProperty(tag);
}

UserRecord.prototype.getTagCountOf = function(tag) {
    return this.musicTags[tag];
}

UserRecord.prototype.incrementTagCountOf = function(tag) {
    this.musicTags[tag]++;
}

UserRecord.prototype.addTag = function(tag) {
    this.musicTags[tag] = 1;
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
    //db op
    var newUserRecord = new UserRecord(user_id);
    addUser(user_id, newUserRecord);
    db.createUserDocument(user_id, callback);

    console.log("createUser", user_id);  
}

module.exports.UserRecord = UserRecord;
module.exports.addUser = addUser;
module.exports.getUser = getUser;
module.exports.createUser = createUser;
