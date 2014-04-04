//Basic input validation utility for user and music IDs
//IDs are alphanumeric, lengths are between 1 and 32 inclusive

var checkInput;
var MIN_LENGTH = 1;
var MUSIC_MAX_LENGTH = 32;
var USER_MAX_LENGTH = 32
var validator = require('validator');

checkInput = function(inputString, inputType) {
    switch (inputType) {
        case 'userID':
            return (validator.isAlphanumeric(inputString) 
                    && validator.isLength(inputString, MIN_LENGTH, USER_MAX_LENGTH));
            break;

        case 'musicID': 
            return (validator.isAlphanumeric(inputString) 
                    && validator.isLength(inputString, MIN_LENGTH, MUSIC_MAX_LENGTH));
            break;
        
        default:
            return false;              
    }

}
module.exports.checkInput = checkInput;