/*
    This route defines the POST/listen endpoint. After validating the qeury parameters, 
    it adds the music info (name, genres) to the respective user in the registry or updates the playback count
    if user has previously listened to it.

*/

var db = require('../models/db_operations.js');
var listen;
var listenToMusic;
var musicStore = require('../models/music_store.js');
var userRegistry = require('../models/users_registry.js');
var validation = require('../utils/input-validator.js');



// POST/listen endpoint handler
listenToMusic = function(req, res) {
    var user = req.body.user, music = req.body.music;

    if (!validation.checkInput(user, 'userID') || !validation.checkInput(music, 'musicID'))
            res.send(403, 'Forbidden format');
    
    listen(user, music, function(err) {
        if (err) res.send(500, err);

        res.send(200);
    });
}

// adds the music info (name, genres) to the respective user in the registry or updates the playback count
//if user has previously listened to it.
listen = function(user_id, current_music, callback) {
    var musicGenres;
    musicGenres = musicStore.getGenresFor(current_music);

    if (musicGenres === undefined) {
        callback('music not found'); 
        return;
    }
    
    userRegistry.getUser(user_id, addMusicToUserRegistry);
    
    function addMusicToUserRegistry(current_user) {
        var playCount, genreCount;
        
        if (current_user.hasListenedTo(current_music)) {
            current_user.incrementPlayCountOf(current_music);
            playCount = current_user.getPlayCountOf(current_music);
            db.updateRecordInDB(current_user.dbId, 'listenedTo', current_music, playCount);
        } else {
            current_user.isListeningTo(current_music);
            db.insertRecordInDB(current_user.dbId, 'listenedTo', current_music, 1);
        }

        for (var i = 0; i < musicGenres.length; i++) {
            if (current_user.hasMusicGenre(musicGenres[i])) {
                current_user.incrementGenreCountOf(musicGenres[i]);
                genreCount = current_user.getGenreCountOf(musicGenres[i]);
                db.updateRecordInDB(current_user.dbId, 'musicGenres', musicGenres[i], genreCount);
            } else {
                current_user.addGenre(musicGenres[i]);
                db.insertRecordInDB(current_user.dbId, 'musicGenres', musicGenres[i], 1);
            }
        }
        callback(null);
    }
    
}

module.exports.listenToMusic = listenToMusic;