/*
    This file describes an interface to the database to be used by other modules.
    It connects to the db server, creates the schema that represents users, retrieves,
    inserts and updates user documents.
*/
var addToArrayInDB; 
var createUserDocument; 
var getFromDB; 
var initUserSchema;
var insertRecordInDB;
var mongoose = require('mongoose');
var openDB;
var updateRecordInDB;
var userDocument;
var userRegistry = require('./user_registry.js');
var userSchema;


initUserSchema = function() {
    userSchema = new mongoose.Schema({
        _userId     :    { type : String, unique : true  },
        _listenedTo :    [{ key : String, value : Number }],
        _musicGenres:    [{ key : String, value : Number }],
        _followees  :    [String]
    });

    userDocument = mongoose.model('users', userSchema);
    if (!userSchema.options.toObject) userSchema.options.toObject = {};

    // toObject() is a function to convert a document into a plain javascript object, we apply the following transformations before returning
    userSchema.options.toObject.transform = function (doc, ret, options) {
        
        delete ret.__v; //the versionKey field is not needed in any future processing
        
        //this function is a also called for subdocuments within a given docuemnt, therefore I check the type of doc before defining my transformation
        if (doc instanceof userDocument) {

            //converted to a UserRecord instance in order to gain access to the prototype methods when added to the user registry
            var resultantUserObject = new userRegistry.UserRecord(ret._userId);
            resultantUserObject.dbId = ret._id;

            for (var i = 0; i < ret._listenedTo.length; i++) {
                var listenedToEntry = ret._listenedTo[i];
                resultantUserObject.listenedTo[listenedToEntry.key] = listenedToEntry.value;
                resultantUserObject.totalSongsPlayed++;
            }
            for (var i = 0; i < ret._musicGenres.length; i++) {
                var musicGenresEntry = ret._musicGenres[i];
                resultantUserObject.musicGenres[musicGenresEntry.key] = musicGenresEntry.value;
            }
            for (var i = 0; i < ret._followees.length; i++) {
                resultantUserObject.followees.push(ret._followees[i]);
            }
            
            return resultantUserObject;
        } 
    }
}

openDB = function (db_name, callback) { 
    var dbConnectionString = "mongodb://localhost/" + db_name;
    mongoose.connect(dbConnectionString, function (err, res) {
        if (err) {
            console.log ('ERROR connecting to: ' + db_name + '! ' + err);
            callback(err);
        } else {
            console.log ('Successfully connected to: ' + db_name);
            callback(null);
        }
    });
}

// Creates a new user document and sends its id to the user registry then saves it to the db.
// Each user record in the registry contains an id to its equivalent document in the db to speed up searches since the _id field is indexed
createUserDocument = function(user_id, callback) {
    var newUserDocument = new userDocument({ _userId: user_id });
    userRegistry.getUser(user_id, function(user) {
        user.dbId = newUserDocument._id;
        
        newUserDocument.save(function (err) {
            if (err) console.log ("Error on save! ", err);
                callback(user);
        });
    });

}

// Fetches a document from db and converts it to a UserRecord object.
// Creates a new userRecord object if user doesn't exist in db and adds it to the users registry in memory.
// After fetching or creating a new record, the user is passed as a paramter to a callback function.
getFromDB = function(user_id, callback) {
    userDocument.findOne({ _userId: user_id }, function (err, current_user) {
        var newUser;
        if (err) console.log("Error: getFromDB, ", err);

        if (!current_user) { //not in db, create user
            userRegistry.createUser(user_id, callback);
        } else { //load to memory from db
            newUser = current_user.toObject();
            userRegistry.addUser(user_id, newUser);
            callback(newUser);
        }
    });
}

// Inserts a subdocument {key, value} to a user document. The subdocument is added to an existing array of subdocuments 
insertRecordInDB = function(doc_id, field, key, value) {
    var id = mongoose.Types.ObjectId(doc_id.toString()), updateObject = {};
    //the update query is created as an object because if embedded directly in the update call, the variables will be treated as literals
    //if field was passed as 'musicList', it will search for field 'field' not 'musicList'
    updateObject['_' + field] = { 'key': key, 'value': value };
        
    userDocument.update({ _id: id }, { $push: updateObject }, function (err, affected_users) {
        if (err) console.log("Error: insertRecordInDB, ", err);
    });    
}

// Updates a subdocument {key, value} in an existong array of subdocuments 
updateRecordInDB = function(doc_id, field, key, value) {
    var id = mongoose.Types.ObjectId(doc_id.toString()), queryObject = {}, updateObject = {};
    queryObject._id = id;
    queryObject['_' + field + '.key'] = key;
    //the positional $ operator acts as a placeholder for the first element that matches the query
    updateObject['_' + field + '.$'] = { 'key': key, 'value': value };
    
    userDocument.update(queryObject, { $set: updateObject }, function (err, affected_users) {
        if (err) console.log("Error: updateRecordInDB, ", err);
    });    
}

//Adds a new vallue to a field of type array in a user document. Doesn't allow duplicates because 'addToSet' is used
addToArrayInDB = function(user_id, field, value) {
    var updateObject = {};
    updateObject['_' + field] = value;

    userDocument.update({ _userId: user_id }, { $addToSet: updateObject }, function (err, affected_users) {
        if (err) console.log("Error: addToArrayInDB, ", err);
    });   

}

initUserSchema();

module.exports.openDB = openDB;
module.exports.createUserDocument = createUserDocument;
module.exports.getFromDB = getFromDB;
module.exports.insertRecordInDB = insertRecordInDB;
module.exports.updateRecordInDB = updateRecordInDB;
module.exports.addToArrayInDB = addToArrayInDB;