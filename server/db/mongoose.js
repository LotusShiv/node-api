const mongoose = require('mongoose');

// Connection URL
//const url = 'mongodb://localhost:27017/TodoApp';
// Database Name
//const dbName = 'TodoApp';

//Set Promise - you will have to do only once
mongoose.Promise = global.Promise;

//connect to database
//var connectUrl = process.env.MONGODB_URI || url;
var connectUrl = process.env.MONGODB_URI;
console.log('Connected to ', connectUrl);
mongoose.connect(connectUrl);

//Note we can export a result object variable 
//or a function object variable
module.exports = {
    mongoose
}