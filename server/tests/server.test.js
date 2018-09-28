const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server.js');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');

var {todos, populateTodos, users, populateUsers} 
    = require('./seed/seed');

//Instead just call this - pass the seed function to 
//beforeEach hook function
beforeEach(populateUsers);
beforeEach(populateTodos);

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
    var id = todos[0]._id.toHexString();
    console.log('id', id);
    
    //positive
    it('should get by id', (done) => {
        request(app)
        .get (`/todos/${id}`)
        .expect(200)
        .expect((res) => {
            expect(res.body.todo.text).toBe(todos[0].text);
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

//Delete
describe('DELETE /todos/:id', () =>{
    it('should remove a todo findOneAndRemove', (done) => {
        var hexId = todos[1]._id.toHexString();

        request(app)
          .delete(`/todos/${hexId}`)
          .expect(200)
          .expect((res) => {
              expect(res.body.todo._id).toBe(hexId);
          })
          .end((err, res) => {
            if (err){
                return done(err);
            }
            //Now lets see if the id exists in db 
            //it shouldn't exist so return 404
            Todo.findById(hexId).then((todo) => {
                expect(todo).toNotExist();
                done();
            })
            .catch((err) => done(err));
        });
    });

    it('should return 404 if todo not found', (done) => {
        id = new ObjectID().toHexString();
        request(app)
        .delete(`/todos/${id}`)
        .expect(404)
        .end(done); 
    });

    it('should return 404 if objectID is invalid', (done) => {
        id = '1113';
        request(app)
        .delete(`/todos/${id}`)
        .expect(404)
        .end(done);
    });
});

//Update
describe('PATCH /todos/:id', () => {
    var hexId = '';
    var doc = {};
    doc = {
        completed: true,
        text: 'Dinner now'
    };
    it('should update the todo', 
      (done) => {
        hexId = todos[0]._id.toHexString();
        console.log('Test 1 id[0] ', hexId);
        request(app)
        .patch(`/todos/${hexId}`)
        .send(doc)
        .expect(200)
        .expect((res) => {
            expect(res.body.todo.text).toBe(doc.text);
            expect(res.body.todo.completed).toBe(true);
            expect(res.body.todo.completedAt).toBeA('number');
        })
        //.end(done);
        .end((err, res) => {
          if (err){
              console.log('err', err);
              return done(err);
          }
          //Check in database
          Todo.findByIdAndUpdate(hexId 
            ,{$set:doc}
            ,{new:true}).then((todo) => {
              expect(todo).toExist();
              //expect(todo.completed).toBe(true);
              //expect(todo.completedAt).toBeA('number');
              done();
          })
          .catch((err) => done(err));
        });
    });

    it('should clear completedAt when todo is not completed', 
      (done) => {
        hexId = todos[1]._id.toHexString();
        doc = {
            "text": 'Time to sleep later',
            "completed": false
        };
        request(app)
        .patch(`/todos/${hexId}`)
        .send(doc)
        .expect(200)
        .expect((res) => {
            expect(res.body.todo._id).toBe(hexId);
            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toNotBeA('number');
        })
        //.end(done)
        .end((err, res) => {
          if (err){
              return done(err);
          }
          //Now lets see if the id exists in db 
          //it shouldn't exist so return 404
          Todo.findByIdAndUpdate(hexId 
            ,{$set:{doc}}
            ,{new:true}).then((todo) => {
              expect(todo).toExist();
              done();
          })
          .catch((err) => done(err));
      });
    });
});

//Users
describe('Get /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
        .get('/users/me')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
            expect(res.body._id).toBe(users[0]._id.toHexString());
            expect(res.body.email).toBe(users[0].email);
        })
        .end(done);
    });

    it('should return 401 if not authenticated', (done) => {
        request(app)
        .get('/users/me')
        .expect(401)
        .expect((res) => {
            expect(res.body).toEqual({});
        })
        .end(done);
    });
});

//Signup route tests
describe('Post /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com';
        var password = '123mnf!';

        request(app)
        .post('/users')
        .send({email, password})
        .expect(200)
        .expect((res) => {
            expect(res.headers['x-auth']).toExist();
            expect(res.body._id).toExist();
            expect(res.body.email).toBe(email);
        })
        //.end(done); 
        //We can also do a db check and verify
        .end((err) => {
            if (err) {
                return done(err);
            }

            User.findOne({email}).then((user) => {
                expect(user).toExist();
                //check if stored password is not input password,
                //if so then we haven't hashed that leads to problems
                expect(user.password).toNotBe(password);
                done();
            });
        });
    });

    it('should return validation errors if request invalid',
       (done) => {
        request(app)
        .post('/users')
        .send({email:'newUser', password: 'newp'})
        .expect(400)
        .end(done);
    });

    it('should not create user if request email in use',
       (done) => {
        request(app)
        .post('/users')
        .send({email: users[1].email, password: 'newpwd12'})
        .expect(400)
        .end(done);
    });
});