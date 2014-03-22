var fs = require('fs');
var file = 'data/follows.json';
var follows, music, listen; 

follows = fs.readFileSync(file, 'utf8');
follows = JSON.parse(follows);

file = 'data/musics.json';
music = fs.readFileSync(file, 'utf8');
music = JSON.parse(music);

file = 'data/listen.json';
listen = fs.readFileSync(file, 'utf8');
listen = JSON.parse(listen);

module.exports.follows = follows.operations;
module.exports.music = music;
module.exports.listen = listen.userIds;