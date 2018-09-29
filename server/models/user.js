const mongoose = require('mongoose'); //load the regular mongoose library
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

//We can't add methods to User but instead we use mongoose
//Schema which provides us with the capability to add all the
//attributes, custom methods etc.,
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        minlength: 10,
        required: true,
        trim: true,
        unique: true, //email doesn't already exist 
        //we are going to use validator library 
        //for validating the email
        validate: {
            // validator: (value) => {
            //     return validator.isEmail(value);
            // },
            //instead we can do as a method to use to validate
            validator: validator.isEmail,
            message: `${this} is not a valid email`
        }
    },
    password: {
        type: String,
        require: true,
        minlength: 6
    },
    //tokens is available in mongoDB (is a NoSQL db)
    // and not available in sql databases like postGres
    tokens: [{
        //syntax set up by mongoose
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

//create a method - i.e. add it to the schema
// we need this binding hence we dont use the arrow fn
// the method added will be instance method on the object
UserSchema.methods.toJSON = function(){
    var user = this;
    //convert mongoose variable to a regular object
    var userObject = user.toObject(); 
    //return with lodash pick what is needed
    return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function(){
    var user = this;  //individual document
    //access token value
    var access = 'auth';
    //data - user id - we grab it like in any server file
    // access - use ES6 
    // secret - will eventually come from a config file
    var token = jwt.sign({_id: user._id.toHexString(),
                 access}, 'abc123').toString();
    
    //user.tokens.push({access, token});
    //instead use this - inconsistencies across mongoDB 
    //versions
    user.tokens = user.tokens.concat([{access, token}]);
    // user.save().then(() => {
    //     return token;
    // }).then((token) => {
    //     return token;
    // });
    //the second then grab this token in server.js and respond to the call
    //so instead of chaining another .then to this we will do
    return user.save().then(() => {
        return token; //we are returning a value itself instead of a promise
    });
};

//statics - turns into a model method than an instance 
//method 
UserSchema.statics.findByToken = function(token){
    var User = this;  //model object hence we use User
    var decoded; //undefined variable 

    //We will use try-catch that way we can catch
    // any error that jwt throw
    try{
        decoded = jwt.verify(token, 'abc123');
    }
    catch(e) {
        // return new Promise((resolve, reject) => {
        //     reject(); //this will get caught in server.js
        // });
        //instead we can simplify to
        return Promise.reject(e.message); //will get used as a error to the catch method
    }
    //Here we will query the nested object properties
    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

//Find user by credentials - creating a model method
UserSchema.statics.findByCredentials = function(email, password){
    var User = this;
    return User.findOne({email}).then((user) => {
        if (!user){
            return Promise.reject();
        }
        //bcrypt doesn't support promise but we can
        //wrap the call with a Promise
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if(res){
                    resolve(user); //resolve the promise
                }
                else{
                    reject(); //this will send a 400 back
                }
            });
        });
    });
};

UserSchema.pre('save', function(next){
    var user = this;
    //we can check if the pwd was modified
    //next time when we update say not the pwd field
    //but the email, then the pwd which was already hashed
    //will get hashed again and the verify will fail
    //hence we need to make sure to check
    if (user.isModified('password')){
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next(); //complete the middleware
            });
        });
    }
    else{
        next();
    }
});

UserSchema.methods.removeToken = function(token){
    //we will use a mongodb operator $pull
    var user = this;

    return user.updateOne({
        $pull: {
            tokens: {token}
        }
    });
};

var User = mongoose.model('User', UserSchema);

module.exports = {User};
