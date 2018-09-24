//const env = process.env.NODE_ENV; //available only in Heroku
//So we modify as 
const env = process.env.NODE_ENV || 'development';
//console.log('env ***', env);

//We need to configure this in our package.json so
//it works locally for our development and test environments
//so it uses one database for dev and one for test
//We set the local PORT, for the database Url we will set up
//here and remove from mongoose.js
// Connection URL
var db = '';
const urlRoot = 'mongodb://localhost:27017';

if (env === 'development'){
    process.env.PORT = 3000;
    db = 'TodoApp';
    process.env.MONGODB_URI = `${urlRoot}/${db}`;
}else if(env === 'test'){
    process.env.PORT = 3000;
    db = 'TodoAppTest';
    process.env.MONGODB_URI = `${urlRoot}/${db}`;
}
//We already have from Heroku
// process.env.PORT, process.env.MONGODB_URI