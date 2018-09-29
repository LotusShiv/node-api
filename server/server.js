require('./config/config');

const _ = require('lodash'); //_ is used as a variable

//Library imports
const express = require('express');
const bodyParser  = require ('body-parser');
const {ObjectID} = require('mongodb');

//Local
//using ES6 destructering syntax var {}
var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

//Start an express appa
var app = express();
//set app to use current environment port variable
const port = process.env.PORT || 3000;
//This environment variable will be set only if the
// app is running on Heroku and not if running locally


//configure middleware body-parser
app.use(bodyParser.json()); 

//Start configuring the routes
//Create
app.post('/todos', authenticate, (req, res) => {
    //Get user input
    var todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });
    //Save info
    todo.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

//Get
app.get('/todos', authenticate, (req, res) => {
  //Todo.find().then((todos) => {
  //Instead do this to fetch only the ones that
  //created by the logged in user
  Todo.find({_creator: req.user._id}).then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

//find by id
app.get('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    //validation
    if (!ObjectID.isValid(id)){
        return res.status(404).send('Invalid id');
    }

    //This way the current logged in user can see anyone
    // else's data by passing the id
    //Todo.findById(id).then((todo) => {
    //So we change it to
    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then((todo) => {
        if (!todo){
            return res.status(404).send();
        }
        res.send({todo});
    }).catch((e) => {
        res.status(400).send(e);
    }) ;
});

//Delete by id
app.delete('/todos/:id', authenticate, (req, res) => {
    //get the id
    var id = req.params.id;
    //validation
    if (!ObjectID.isValid(id)){
        return res.status(404).send('Invalid id');
    }
    
    //This will find the document created by someone else
    //Todo.findByIdAndRemove(id)
    //Instead we have to use findOneAndRemove(id)
    //so we find the one created by the current logged in user
    //and the creater of the document
    Todo.findOneAndRemove({
            _id: id,
            _creator: req.user._id
        })
        .then((todo) => {
            if (!todo){
                return res.status(404).send();
            }
            res.send({todo});
        }).catch((e) => {
            res.status(400).send();
        }
    );
});

//Update
app.patch('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);
    if (!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    //Say user set completed to true we may want to
    //completedAt with a datetime stamp
    //clear if false
    //by checking if the body.completed is a boolean
    //  and if it is true
    if(_.isBoolean(body.completed) 
      && body.completed){
          body.completedAt = new Date().getTime();
          //JS timestamp from 1970 moment forward name for that date
    }
    else{
        body.completed = false;
        body.completedAt = null;
    }

    //In mongodb we use returnOriginal : false indicating
    // to return the changed object
    //similarly in mongoose we need to use the way it provides
    // as new: true showing return the changed (new)state
    //Todo.findByIdAndUpdate
    //(id, {$set: body}, {new: true})
    //We have to use findOneAndUpdate as we need to find
    //the todo document created by the current user
    Todo.findOneAndUpdate
     ({_id: id, _creator: req.user._id}, {$set: body}, {new: true})
     .then((todo) => {
        if (!todo){
            return res.status(404).send();
        }
        res.send({todo});
    })
    .catch((err) => res.status(400).send());
});


//***************************************
//Users
//POST /todos
app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    var user = new User(body);
    
    //This argument (user) is identical to the one defined 
    //above in memory, so we can reuse and dont have to pass in 
    //user.save().then((user) => {
    //instead we can use
    user.save().then(() => {
        //res.send(user);
        //we instead do this
        return user.generateAuthToken();
    }).then((token) => {  //we chain the promise as we want to use the token response
        //we need to make the response - goal is to send the
        //http response header by creating a custom header
        //not a default http supported header, but is a custom header
        //x-auth that's specific to jwt tokens scheme
        res.header('x-auth', token).send(user);
    })
    .catch((e) => {
        res.status(400).send(e);
    });
});

//Once we have the middleware method authenticate
//change the route signature
//First private route to know about the current user
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

//dedicated route for logging in users
//cannot use authenticate we dont have a token here
// as we are trying to get a token
app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    //console.log('body.email', body.email);
    // 
    User.findByCredentials(body.email, body.password)
        .then((user) => {
           //res.send(user);
           //instead we send back a user with
           // an authenticated token
           user.generateAuthToken().then((token) => {
              res.header('x-auth', token).send(user);
           });
        })
        .catch((e) => res.status(400).send());    
});

//DELETE token route
//NOTE: 1. all we need to make sure that the currently
//      logged in user deleting is authenticated
//      we are not going to send any token, instead
//      we are going to make this route just private
//      and add the token via the authenticate method
//      2. in order to delete the token for the currently
//      logged in user, the user has to be in the users
//      collection in the db as well.
app.delete('/users/me/token', authenticate, (req, res) => {
    //we use the instance method to do the actual delete
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    });
});

//Add listener
app.listen(port, () => {
    console.log(`Started node-api on port ${port}`);
});

//We need to export the app object so we can use 
//in the test script file
module.exports = {app};
