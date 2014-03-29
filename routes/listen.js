
/*
 * GET home page.
 */
var musicStore = require('../models/music_store.js'),
    userRegistry = require('../models/users_registry.js'),
    db = require('../models/db_operations.js');
    ;


exports.listenToMusic = function(req, res) {
    var user = req.body.user, music = req.body.music;

    var err = listen(user, music);
    //WRONG, need a callback if i were to return errors 
    if (err) res.send(err);
    else res.send(200);

}

listen = function(user_id, current_music) {
    var musicTags = musicStore.getTagsFor(current_music);
    if (musicTags === undefined) return "err";
    
    var user = userRegistry.getUser(user_id);
    if (user === undefined) { 
        console.log('need to fetch from db');
        db.getFromDB(user_id, addMusicToUserRegistry);
    } else {
        addMusicToUserRegistry(user);
    }

    function addMusicToUserRegistry(current_user) {
        if (current_user.hasListenedTo(current_music)) {
            current_user.incrementPlayCountOf(current_music);
            var playCount = current_user.getPlayCountOf(current_music);
            db.updateRecordInDB(current_user.dbId, 'listenedTo', current_music, playCount);

        } else {
            current_user.isListeningTo(current_music);
            console.log("user dbID", current_user.dbId, current_user);
            db.insertRecordInDB (current_user.dbId, 'listenedTo', current_music, 1);
        }

        for (var i = 0; i < musicTags.length; i++) {
            if (current_user.hasMusicTag(musicTags[i])) {
                current_user.incrementTagCountOf(musicTags[i]);
                var tagCount = current_user.getTagCountOf(musicTags[i]);
                db.updateRecordInDB(current_user.dbId, 'musicTags', musicTags[i], tagCount);
            } else {
                current_user.addTag(musicTags[i]);
                db.insertRecordInDB(current_user.dbId, 'musicTags', musicTags[i], 1);
            }
        }

    }
}

