const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server.js');
const {Todo} = require('./../models/todo.js');

//Run this before each test script
// beforeEach((done) => {
//     Todo.remove({}).then(() => done());
// });
//Add some seed data
const todosNew = [
    {_id: new ObjectID(), text: 'First todo'},
    {_id: new ObjectID(),text: 'Second todo'}
];

//Run this before each test script
beforeEach((done) => {
    Todo.remove({}).then(() => {
       //insertMany
       return Todo.insertMany(todosNew); 
    }).then(() => done());
});

describe('POST /todos', () => {
    it ('should create a new todo', (done) => {
        var text = 'Testing for POST request 1';
        var completed = false;
        request(app)
        .post('/todos')
        .send({text: text, completed: completed})
        .expect(200)
        .expect((res) => {
            expect(res.body.text).toBe(text);
            })
        .end((err, response) => {
            if (err){
                return done(err);
            }
            //We are going to assert what got really
            // inserted into the mongoDB database
            //a)that the todos.length = 1
            //b)the actual text inserted
            //c)call done to wrap up the test case
            Todo.find({text}).then((todos) =>{
                expect(todos.length).toBe(1);
                expect(todos[0].text).toBe(text);
                done();
            })
            .catch((e) => done(e)); 
        });
    });

    //empty object test
    it('should not create todo with invalid body data', (done) => {
        request(app)
        .post('/todos')
        .send({})
        .expect(400)
        .end((err, response) => {
            if (err){
                return done(err);
            }
            
            Todo.find().then((todos) =>{
                expect(todos.length).toBe(2);
                done();
            })
            .catch((e) => done(e)); 
        });
    });
});

//Get /todos as a different test group
describe('Get /todos', () => {
    it('should get all todos', (done) => {
        request(app)
        .get ('/todos')
        .expect(200)
        .expect((res) => {
            expect(res.body.todos.length).toBe(2);
            //no need for done() here 
            //as we aren't doing anything asynchronously
        })
        .end(done);
    });
});

//find by id tests
describe('Get /todos/:id', () => {
    var id = todosNew[0]._id.toHexString();
    console.log('id', id);
    
    //positive
    it('should get by id', (done) => {
        request(app)
        .get (`/todos/${id}`)
        .expect(200)
        .expect((res) => {
            expect(res.body.todo.text).toBe(todosNew[0].text);
        })
        .end(done);
    });

    //404 Not in collection
    it('should return 404 if todo not found', (done) => {
        id = new ObjectID().toHexString();
        request(app)
        .get(`/todos/${id}`)
        .expect(404)
        .end(done); 
    });

    //non-objectIDs
    it('should return 404 for non-object ids', (done) => {
        id = '1113';
        request(app)
        .get(`/todos/${id}`)
        .expect(404)
        .end(done); 
    });
});