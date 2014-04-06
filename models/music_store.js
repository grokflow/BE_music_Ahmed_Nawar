/*
	This file is responsible for loading the musics.json files into memory upon startup.
	It parses the file into a JS object, defines functions to retrieve genres for a given song and
	load all music list. 
*/
var file = './data/musics.json';
var getGenresFor;
var musicFile = require('fs').readFileSync(file, 'utf8');
var musicStore;

musicStore = JSON.parse(musicFile);

getGenresFor = function(music_title) {
    return musicStore[music_title];
}

getAllMusic = function() {
	var musicList = [];
	for (var music in musicStore) {
  		if (musicStore.hasOwnProperty(music)) {
    		musicList.push(music);
  		}
  	}
  	return musicList;
}

module.exports.getGenresFor = getGenresFor;
module.exports.getAllMusic = getAllMusic;