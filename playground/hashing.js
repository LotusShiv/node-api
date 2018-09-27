const {SHA256} = require('crypto-js');
const jwt =  require('jsonwebtoken');
const bcrypt = require('bcryptjs');

var password = '123abc!';

//salt & then hash
//Salting will add a bunch of different characters
//each time a different one. bcrypt is generally takes
//longer
// bcrypt.genSalt(10, (err, salt) => {
//     bcrypt.hash(password, salt, (err, hash) => {
//         console.log('hash', hash);
//     });
// });

var hashedPwd = '$2a$10$Q1h/t46eZmhr7Wuuev0t2udfZLWJxJcYjucYSZFMYjYdcmJSGQ/zG';
//compare
bcrypt.compare(password, hashedPwd, (err, res) => {
    console.log('res', res );
});
