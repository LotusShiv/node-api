const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test'){
    //load a separate json file which will not become part of 
    //the git repository
    var config = require('./config.json');
    var envConfig = config[env];
    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key];
    });
}
