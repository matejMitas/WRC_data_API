// getting-started.js
const mongoose = require('mongoose');
const dbName = 'wrc_data';
mongoose.connect(`mongodb://localhost/${dbName}`);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

//Define a schema
var Schema = mongoose.Schema;
var SomeModelSchema = new Schema({
    name: String
});

// Compile model from schema
var SomeModel = mongoose.model('SomeModel', SomeModelSchema );
var awesome_instance = new SomeModel({ name: 'test'});
// Save the new model instance, passing a callback
awesome_instance.save(function (err) {
  if (err) throw err;
  // saved!
  console.log('ulozeno');
});

// find all athletes that play tennis
var query = SomeModel.find({});

query.exec(function (err, res) {
  if (err) throw err;
  // athletes contains an ordered list of 5 athletes who play Tennis
  console.log(res);
})

//mongoose.disconnect();