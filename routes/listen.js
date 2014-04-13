/*
    This route defines the POST /listen endpoint. After validating the qeury parameters, 
    it adds the music info (name, genres) to the respective user or updates the playback count
    if user has previously listened to it.
*/

var async = require('async');
var listen;
var listenToMusic;
var musicStore = require('../models/music_store.js');
var User = require('../models/user.js').User;
var validation = require('../utils/input-validator.js');

// POST /listen endpoint handler
listenToMusic = function(req, res) {
    var userId = req.body.user, music = req.body.music;

    if (!validation.checkInput(userId, 'userID') || !validation.checkInput(music, 'musicID'))
            res.send(403, 'Forbidden format');
    
    listen(userId, music, function(err) {
        if (err) res.send(500, err);

        res.send(200);
    });
}

// adds the music info (name, genres) to the respective user or updates the playback count
// if user has previously listened to it.
listen = function(user_id, current_music, listenRequestDone) {
    var musicGenres = musicStore.getGenresFor(current_music);  
    if (musicGenres === undefined) {
        listenRequestDone('music not found'); 
        return;
    }

    User.getUser(user_id, addMusicToUser);

    function addMusicToUser(current_user) {        
        current_user.isListeningTo(current_music, function() {
            // bind will attach a context to the iterator before passing it to async. 
            // otherwise this._id, in the addGenre function passed to upsertDocument will be undefined 
            // because it is not evaluated in the context of the current_user when used by async

            async.each(musicGenres, current_user.addGenre.bind(current_user), listenRequestDone);
        });
    }
}

module.exports.listenToMusic = listenToMusic;