
var userRegistry = require('../models/users_registry.js'),
    musicStore = require('../models/music_store.js'),
    db = require('../models/db_operations.js'),
    recommendMusic,
    NO_COMMON_TAG_COEFFICIENT = 0.1,
    NEW_MUSIC_RATING = 100,
    OLD_MUSIC_RATING = 10,
    RECOMMENDATIONS_COUNT = 5,
    FIRST_DEGREE_COEFFICIENT = 6;
    ;
    

recommendMusic = function (req, res) {
    var userId = req.query.user;
    recommend(userId, function(arr) {
        res.setHeader('Content-Type', 'application/json');
        var str = JSON.stringify({"list":  arr});
        res.end(str);
    });
}

computeTagsCoefficient = function (music_title, current_user) {
    var musicTags = musicStore.getTagsFor(music_title);
    var coefficient = 0;
    for (var i = 0; i < musicTags.length; i++) {
        if (current_user.hasMusicTag(musicTags[i]))
            coefficient += current_user.hasMusicTag(musicTags[i]);
    }
    if (coefficient === 0) coefficient = NO_COMMON_TAG_COEFFICIENT;
    else (coefficient /= current_user.getTotalTagCount());
    
    return coefficient;
}

addToListIfBetter = function(list, music_title, rating) {
    var minPos = 0;
    //console.log(music_title, rating, list);
    for (var i = 1; i < list.length; i++) {
        if (list[i].rating < list[minPos].rating)
            minPos = i; 
    }

    if (rating > list[minPos].rating) {
        list[minPos].rating = rating;
        list[minPos].music = music_title;
    }
    //review 
}
initRecommendationList = function(count) {
    var data = []; // user defined length

    for (var i = 0; i < count; i++) {
        data.push({music : "", rating : 0});
    }
    return data;
}
recommend = function(user_id, callback) {
    console.log('recommend begin');
    var musicList, tagsCoefficient, recommendationList;
    var user = userRegistry.getUser(user_id);

    if (user === undefined) {
        db.getFromDB(user_id, getUserFolloweesMusicList)
    } else {
        getUserFolloweesMusicList(user);
    }
    

    function getUserFolloweesMusicList(current_user) {
        current_user.discoverFolloweesMusic(rateMusic);
    }

    function rateMusic(current_user, followees_music_list) {

        recommendationList = initRecommendationList(RECOMMENDATIONS_COUNT);
        musicList = musicStore.getAllMusic();
        console.log(followees_music_list);

        for (var i = 0; i < musicList.length; i++) {
            var currentSong = musicList[i];
            if (current_user.hasListenedTo(currentSong)) {
                currentMusicRating = OLD_MUSIC_RATING;
            } else {
                currentMusicRating = NEW_MUSIC_RATING;
            }

            if (followees_music_list.hasOwnProperty(currentSong))
                currentMusicRating *= FIRST_DEGREE_COEFFICIENT;

            tagsCoefficient = computeTagsCoefficient(currentSong, current_user);
            currentMusicRating *= tagsCoefficient;
            addToListIfBetter(recommendationList, currentSong, currentMusicRating);
        }

        recommendationList.sort(compare);
        console.log(recommendationList);
        var result = recommendationList.map(function(e) {return e.music});
        callback(result);
    }
}

function compare(a, b) {
    if (a.rating > b.rating)
        return -1;
    if (b.rating > a.rating)
        return 1;

    return 0;
}

module.exports.recommendMusic = recommendMusic;