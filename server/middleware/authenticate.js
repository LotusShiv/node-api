var {User} = require('./../models/user');

//Add the authenticate middleware
var authenticate = (req, res, next) => {
    var token = req.header('x-auth');

    User.findByToken(token).then((user) => {
        if (!user){
            return Promise.reject();
        }

        req.user = user;
        req.token = token;
        //We have to call next here, otherwise, 
        //the next action in the calling method
        // in this case, the callback function in 
        //the get('/users/me') will never run
        next();
    }).catch((e) => {
        res.status(401).send();
    });
};

module.exports = {authenticate};