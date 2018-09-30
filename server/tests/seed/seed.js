const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
//Add users
const users = [
    {
        _id: userOneId,
        email: 'andrew@example.com',
        password: 'userOnePass',
        tokens: [
            {
                access: 'auth',
                token: jwt.sign(
                    {_id: userOneId, access: 'auth'},
                    process.env.JWT_SECRET).toString()
            }
        ]
    }, //tokens need to be added only once
    {
        _id: userTwoId,
        email: 'jen@example.com',
        password: 'userTwoPass',
        tokens: [
            {
                access: 'auth',
                token: jwt.sign(
                    {_id: userTwoId, access: 'auth'},
                    process.env.JWT_SECRET).toString()
            }
        ]
    }
];

//Add some seed data
const todos = [
    {
        _id: new ObjectID(), 
        text: 'dinner',
        _creator: userOneId
    },
    {
        _id: new ObjectID(),
        text: 'Second todo',
        completed: true,
        completedAt: 3333,
        _creator: userTwoId
    }
];

const populateTodos = (done) => {
    Todo.remove().then(() => {
       //insertMany
       return Todo.insertMany(todos); 
    }).then(() => done());
};

const populateUsers = (done) => {
    User.remove().then(() => {
        //Two promises 
        //Also middleware runs due to the call of save()
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();

        //Waits for both promises to succeed
        return Promise.all([userOne, userTwo]);
    }).then(() => done()); //we are chaining the promise
};

module.exports = {
    todos, 
    populateTodos,
    users,
    populateUsers
};