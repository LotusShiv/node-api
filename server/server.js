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
app.post('/todos', (req, res) => {
    //Get user input
    var todo = new Todo({
        text: req.body.text
    });
    //Save info
    todo.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

//Get
app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

//find by id
app.get('/todos/:id', (req, res) => {
    var id = req.params.id;
    //validation
    if (!ObjectID.isValid(id)){
        return res.status(404).send('Invalid id');
    }
    Todo.findById(id).then((todo) => {
        if (!todo){
            return res.status(404).send();
        }
        res.send({todo});
    }).catch((e) => {
        res.status(400).send(e);
    }) ;
});

//Delete by id
app.delete('/todos/:id', (req, res) => {
    //get the id
    var id = req.params.id;
    //validation
    if (!ObjectID.isValid(id)){
        return res.status(404).send('Invalid id');
    }
    
    //findbyidandremove
    Todo.findByIdAndRemove(id)
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
app.patch('/todos/:id', (req, res) => {
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
    Todo.findByIdAndUpdate
     (id, {$set: body}, {new: true})
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

//Add listener
app.listen(port, () => {
    console.log(`Started node-api on port ${port}`);
});

//We need to export the app object so we can use 
//in the test script file
module.exports = {app};
