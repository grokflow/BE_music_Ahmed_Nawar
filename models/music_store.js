var file = './data/musics.json',
	musicFile = require('fs').readFileSync(file, 'utf8'),
	musicStore,
	getGenresForMusic;
	;

musicStore = JSON.parse(musicFile);

getTagsFor = function(music_title) {
	return musicStore[music_title];
}

module.exports.getTagsFor = getTagsFor;

