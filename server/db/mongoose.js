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
//To avoid node:10456 error - current URL string parser
//.. use the {useNewUrlParser: true}
mongoose.connect(connectUrl, { useNewUrlParser: true });
//To avoid the DeprecationWarning: collection ensureIndex
// warning add these 2 lines of code below
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

//Note we can export a result object variable 
//or a function object variable
module.exports = {
    mongoose
}