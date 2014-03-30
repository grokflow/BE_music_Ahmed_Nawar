var file = './data/musics.json',
    musicFile = require('fs').readFileSync(file, 'utf8'),
    musicStore,
    getGenresForMusic;
    ;

musicStore = JSON.parse(musicFile);

getTagsFor = function(music_title) {
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

module.exports.getTagsFor = getTagsFor;
module.exports.getAllMusic = getAllMusic;
