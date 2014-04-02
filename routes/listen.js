var db = require('../models/db_operations.js');
var listen;
var listenToMusic;
var musicStore = require('../models/music_store.js');
var userRegistry = require('../models/users_registry.js');


listenToMusic = function(req, res) {
    var user = req.body.user, music = req.body.music;
    listen(user, music, function(err) {
        if (err) res.send(500, err);

        res.send(200);
    });
}

listen = function(user_id, current_music, callback) {
    var musicTags, user; 
    musicTags = musicStore.getTagsFor(current_music);

    if (musicTags === undefined) {
        callback('music not found'); 
        return;
    }
    user = userRegistry.getUser(user_id);
    if (user === undefined) { 
        db.getFromDB(user_id, addMusicToUserRegistry);
    } else {
        addMusicToUserRegistry(user);
    }

    function addMusicToUserRegistry(current_user) {
        var playCount, tagCount;
        
        if (current_user.hasListenedTo(current_music)) {
            current_user.incrementPlayCountOf(current_music);
            playCount = current_user.getPlayCountOf(current_music);
            db.updateRecordInDB(current_user.dbId, 'listenedTo', current_music, playCount);
        } else {
            current_user.isListeningTo(current_music);
            db.insertRecordInDB (current_user.dbId, 'listenedTo', current_music, 1);
        }

        for (var i = 0; i < musicTags.length; i++) {
            if (current_user.hasMusicTag(musicTags[i])) {
                current_user.incrementTagCountOf(musicTags[i]);
                tagCount = current_user.getTagCountOf(musicTags[i]);
                db.updateRecordInDB(current_user.dbId, 'musicTags', musicTags[i], tagCount);
            } else {
                current_user.addTag(musicTags[i]);
                db.insertRecordInDB(current_user.dbId, 'musicTags', musicTags[i], 1);
            }
        }

    }
    callback(null);
}

module.exports.listenToMusic = listenToMusic;
