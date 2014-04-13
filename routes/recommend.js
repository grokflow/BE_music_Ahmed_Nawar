/*
    This route defines the GET/recommendations endpoint and the recommendation logic, which is:
    
    for a given music M, its relevance R would be based on three factors:
        N: whether the song is new to the user, 
        G: whether its genres are amongst the user's favorites,
        F: and number of followees who listened to it before .

    To maximize a song’s relevance to a user, N should be fullfilled, G and F should be maximized.
    the formula I am using is:
        
        R(M) = 25 N(M) x (10 G(M) + 5 F(M))

    N(M) = if playbackCount(M) = 0, return 1 else return 0;
    Since the emphasis is on discovery of new songs, a previously heard song receives a score of 0 and music novelty gets the highest coefficient. 

    G(M) is the arithmetic mean of the genres score of M related to the user. for a given genre g and user u, 
    its score is: (number of songs listened by u that belong to g) / (total number of songs listened by u). 
    if G(M) is zero, I return a small constant (0.1) in case the user is still new and didn’t listen to much music.
    
    F(M) = (number of followees who listened to M) / (total number of followees) 

*/
var addToRecommendationListIfBetter;
var computeFolloweesScore;
var computeGenresScore;
var computeMusicHistoryScore;
var initRecommendationList;
var musicStore = require('../models/music_store.js');
var recommendTo;
var recommendMusic;
var User = require('../models/user.js').User;
var validation = require('../utils/input-validator.js');

const NO_COMMON_GENRE_SCORE = 0.1;
const NEW_MUSIC_SCORE = 1;
const MUSIC_HISTORY_COEFFICIENT = 25;
const GENRES_COEFFICIENT = 10;
const FOLLOWEES_COEFFICIENT = 5;
const RECOMMENDATIONS_COUNT = 5;

// GET/recommendations endpoint handler
recommendMusic = function(req, res) {
    var userId = req.query.user;

    if (!validation.checkInput(userId, 'userID'))
        res.send(403, 'Forbidden user format');
    
    recommendTo(userId, function(arr) {
        res.setHeader('Content-Type', 'application/json');
        var str = JSON.stringify({"list":  arr});
        res.end(str);
    });
}

// F(M) defined above
computeFolloweesScore = function(current_song, followees_music_list, followees_count) {
    if (followees_music_list.hasOwnProperty(current_song))
        return followees_music_list[current_song] / followees_count;

    return 0;
}

// G(M) function defined above
computeGenresScore = function(current_song, user_genres_list, user_music_list) {
    var musicGenres = musicStore.getGenresFor(current_song);
    var numberOfGenres = musicGenres.length;
    var score = 0;

    // add a function to load genre list same like followees
    for (var i = 0; i < numberOfGenres; i++) {
        var currentGenre = musicGenres[i];
        if (user_genres_list.hasOwnProperty(currentGenre))
            score += user_genres_list[currentGenre];
    }

    //will result in NaN if no songs were played
    score /= user_music_list['totalSongsPlayed'];
    
    if (score === 0 || isNaN(score)) { //no common genres or no songs played
        score = NO_COMMON_GENRE_SCORE;
    } else {
        score /= numberOfGenres;
    }
    return score;
}

// N(M) function defined above
computeMusicHistoryScore = function(current_song, user_music_list) {
    if (user_music_list.hasOwnProperty(current_song))
        return 0;
    
    return NEW_MUSIC_SCORE;
}

// adds a music if its rating is higher than the song with the least rating
// in the current recommendation list and the old music is discarded from the list
addToRecommendationListIfBetter = function(list, music_title, rating) {
    var minPos = 0;

    //get the song with the least rating in the list
    for (var i = 1; i < list.length; i++) {
        if (list[i].rating < list[minPos].rating)
            minPos = i; 
    }

    if (rating > list[minPos].rating) {
        list[minPos].rating = rating;
        list[minPos].music = music_title;
    }
}

initRecommendationList = function(count) {
    var data = [];

    for (var i = 0; i < count; i++) {
        data.push({music : "", rating : 0});
    }
    return data;
}

// the function responsible for compiling the recommendation list for a specific user
// it iterates over all songs availbles and computes the relevancy score

recommendTo = function(user_id, recommendationRequestDone) {
    User.getUser(user_id, rateMusic);

    function rateMusic(current_user) {
        var musicList, recommendationList, result, currentMusicRating;

        musicList = musicStore.getAllMusic();
        //if number of needed recommended songs is greater than songs available to rate
        recommendationList = initRecommendationList(musicList.length < 5 ? musicList.length : RECOMMENDATIONS_COUNT);
        
        current_user.compileLists(function (own_music_list, followees_music_list, own_genres_list, followees_count) {
            for (var i = 0; i < musicList.length; i++) {
                var currentSong = musicList[i];
                
                currentMusicRating =  computeFolloweesScore(currentSong, followees_music_list, followees_count);
                currentMusicRating *= FOLLOWEES_COEFFICIENT;            
                currentMusicRating += (GENRES_COEFFICIENT * computeGenresScore(currentSong, own_genres_list, own_music_list));
                currentMusicRating *= (MUSIC_HISTORY_COEFFICIENT * computeMusicHistoryScore(currentSong, own_music_list));
                addToRecommendationListIfBetter(recommendationList, currentSong, currentMusicRating);
            }

            recommendationList.sort(compare);
            result = recommendationList.map(function(e) { return e.music; });
            recommendationRequestDone(result);
        });        
    }
}

// helper function for sorting descnedingly by rating
function compare(a, b) {
    if (a.rating > b.rating)
        return -1;
    if (b.rating > a.rating)
        return 1;

    return 0;
}

module.exports.recommendMusic = recommendMusic;