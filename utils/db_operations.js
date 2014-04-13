var mongoose = require('mongoose');

var openDB = function (db_name, callback) { 
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
module.exports.open = openDB;