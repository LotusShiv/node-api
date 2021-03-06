var mongoose = require('mongoose');

var Todo = mongoose.model('Todo', {
    text: {
        type: String,
        required: true,
        minlength: 5
    },
    completed:{
        type: Boolean,
        default: false
    },
    completedAt:{
        type: Number,  //as we are using Unix timestamp
        default: null
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

module.exports = {Todo};