const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

//Remove all
// Todo.remove({}).then((result) => {
//     console.log('Result removeall ', result);
// });

//findOneAndRemove
Todo.findOneAndRemove({text: 'Meeting Susan'}).then((res) => {
    console.log('findOneAndRemove doc', JSON.stringify(res, undefined, 2));
}).catch(err => console.log(err));

//findByIdAndRemove
Todo.findByIdAndRemove(
   {
    _id: new ObjectID('5ba68ec7af7ce525e025fb2a')
   }).then((res) => {
   console.log('findByIdAndRemove doc ', JSON.stringify(res, undefined, 2));
}).catch(err => console.log(err));
