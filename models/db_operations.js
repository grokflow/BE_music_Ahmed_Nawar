var mongoose = require('mongoose'),
    userRegistry = require('./users_registry.js'),
    userDocument,
    userSchema,
    initUserSchema,
    openDB,
    createUserDocument,
    insertRecordInDB
    ;


initUserSchema = function() {
    userSchema = new mongoose.Schema({
        _userId     :    { type : String, unique : true  },
        _listenedTo :    [{ key : String, value : Number }],
        _musicTags  :    [{ key : String, value : Number }],
        _followees  :    [String],
    });

    userDocument = mongoose.model('users', userSchema);
    if (!userSchema.options.toObject) userSchema.options.toObject = {};

    userSchema.options.toObject.transform = function (doc, ret, options) {
        // remove the _id of every document before returning the result
        
        delete ret.__v;
        if (doc instanceof  userDocument) {
            var myRet = new userRegistry.UserRecord(ret._userId);
            myRet.dbId = ret._id;

            for (var i = 0; i < ret._listenedTo.length; i++) {
                var listenedToEntry = ret._listenedTo[i];
                myRet.listenedTo[listenedToEntry.key] = listenedToEntry.value;
            }
            for (var i = 0; i < ret._musicTags.length; i++) {
                var musicTagsEntry = ret._musicTags[i];
                myRet.musicTags[musicTagsEntry.key] = musicTagsEntry.value;
                myRet.totalTagCount += musicTagsEntry.value;
            }
            for (var i = 0; i < ret._followees.length; i++) {
                myRet.followees.push(ret._followees[i]);
            }
            
            return myRet;
        } 
    }
}

openDB = function (db_name, callback) { 
    var dbConnectionString = "mongodb://localhost/" + db_name;
    mongoose.connect(dbConnectionString, function(err, res) {
        if (err) {
            console.log ('ERROR connecting to: ' + db_name + '! ' + err);
        } else {
            console.log ('Successfully connected to: ' + db_name);
            callback();
        }
          //better error handling
    });
}

createUserDocument = function(user_id, callback) {
    var newUserDocument = new userDocument({ _userId : user_id });
    var user = userRegistry.getUser(user_id);
    user.dbId = newUserDocument._id;

    newUserDocument.save(function (err) {
        if (err) console.log ("Error on save!");
        
        console.log("createUserDocument saving", user_id);
        callback(user);
    });
}

getFromDB = function(user_id, callback) {
    userDocument.findOne({ _userId: user_id }, function (err, current_user) {
        var newUser;
        if (!current_user) { //not in db
            console.log("getFromDB, not in db", user_id);
            userRegistry.createUser(user_id, callback);
        } else { //load to memory from db
            console.log("getFromDB, load to memory db", user_id);
            newUser = current_user.toObject();
            userRegistry.addUser(user_id, newUser);
            callback(newUser);
        }
    });
}

insertRecordInDB = function(db_id, property, key, value) {
    console.log("insert", db_id);
    var id = mongoose.Types.ObjectId(db_id.toString()), updateObject = {};

    updateObject['_' + property] = { 'key': key, 'value': value };
    
    console.log("updateObject in insert", updateObject);
    
    userDocument.update({_id: id }, { $push : updateObject}, function (err, affected_users) {
        if (affected_users) {
            console.log("affected_users insert: ", affected_users);
        } else {
            console.log("sad day");
        }
    });    
}

updateRecordInDB = function(db_id, property, key, value) {
        console.log("update", property);

    var id = mongoose.Types.ObjectId(db_id.toString()), queryObject = {}, updateObject = {};
    queryObject._id =  id;
    queryObject['_' + property + '.key'] = key;
    updateObject['_' + property + '.$'] = { 'key': key, 'value': value };
    
    console.log("updateObject in update", updateObject);
    
    userDocument.update(queryObject, { $set : updateObject}, function (err, affected_users) {
        if (affected_users) {
            console.log("affected_users update: ", affected_users);
        } else {
            console.log("sad day");
        }
    });    
}

addToArrayInDB = function(user_id, property, value) {
    var updateObject = {};
    updateObject['_' + property] = value;
    console.log("in array", updateObject);
    userDocument.update({_userId: user_id }, { $push : updateObject}, function (err, affected_users) {
        if (affected_users) {
            console.log("affected_users element array: ", affected_users);
        } else {
            console.log("sad day");
        }
    });   

}

initUserSchema();

module.exports.openDB = openDB;
module.exports.createUserDocument = createUserDocument;
module.exports.getFromDB = getFromDB;
module.exports.insertRecordInDB = insertRecordInDB;
module.exports.updateRecordInDB = updateRecordInDB;
module.exports.addToArrayInDB = addToArrayInDB;

