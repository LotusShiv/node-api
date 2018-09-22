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

//Start an express app
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

//Add listener
app.listen(port, () => {
    console.log(`Started node-todo-api on port ${port}`);
});

//We need to export the app object so we can use 
//in the test script file
module.exports = {app};
