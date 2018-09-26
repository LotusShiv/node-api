const {SHA256} = require('crypto-js');
const jwt =  require('jsonwebtoken');

var data = {
    id: 10
};
var randomstring = ''; 
//randomstring=Math.random().toString(36).substring(2, 4);
randomstring = 'mysecret';
var token = jwt.sign(data, randomstring);
console.log(token);

//Only when the token and secret remains the same that jwt.verify succeeds
var decoded = jwt.verify(token, randomstring);
console.log('decoded', decoded);
