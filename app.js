var express = require('express');
var routes = require('./routes');
var http = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var mydata = require('./data/myfiles');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

var userList = [];
function user(id) {
  this.id = id;
  this.genres = {};
  this.follows = {};
  this.musicList = {};
}

function findUserById(id) {
	return userList.map(function(e) { return e.id; }).indexOf(id);
}
function userExists(id) {
	return (findUserById(id) != -1); 
}
function addUser(id) {
	userList.push(new user(id));
}
function addEntry(id, key, value) {
	var index = findUserById(id);
	var obj = userList[index];
	obj[key][value] = true;
}
for (var i = 0; i < 5; ++i)
	addUser(i);

addEntry(3, "follows", "hamada");
addEntry(3, "follows", "hamada");

console.log(userExists(32)); 