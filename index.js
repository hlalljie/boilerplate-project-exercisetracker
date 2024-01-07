const express = require('express');
const app = express();
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  exercises: [{
      date: {
        type: Date,
        required: true
      },
      duration: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
});

let userRecord = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.use("/api/users", bodyParser.urlencoded({extended: false}));

// Save new user record
app.post('/api/users', (req, res) => {
  let newUsername = req.body.username;
  let newUser = new userRecord({username: newUsername});
  try {
    newUser.save();
    res.json({username: newUser.username, _id: newUser._id});
  }
  catch(err){
    console.error(err);
    res.json({error:"User cannot be created"});
  }
});

// Show list of all users
app.get('/api/users', async (req, res) => {
  const arr = (await userRecord.find()).map(({_id, username}) => ({_id, username}));
  res.json(arr);
});

app.use('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}));

// Save exercise record
app.post('/api/users/:_id/exercises', async (req, res) => {
  try{
    let foundUser = await userRecord.findById(req.params._id).exec();
    let exerciseDate;
    // If date is left empty, use now
    if (req.body.date == ""){
      exerciseDate = new Date();
    }
    else{
        exerciseDate = new Date(req.body.date);
    }
    // Check if date input is valid date
    if (exerciseDate instanceof Date && !isNaN(exerciseDate)){
      let username = foundUser.username;
      foundUser.exercises.push({description: req.body.description, duration: parseFloat(req.body.duration), date: exerciseDate});
      foundUser.save();

      // Map stored dates to readable strings
      //exercisesDisplay = foundUser.exercises.map(({date, duration, description}) => ({date: date.toDateString(), duration, description}));

      // Show exercises
      //res.json({_id: foundUser._id, username: foundUser.username, exercises: exercisesDisplay});
      
      // Show user with exercise fields added
      return res.json({_id: req.params._id, username: username, date: exerciseDate.toDateString(), duration: parseFloat(req.body.duration), description: req.body.description});
    }
    else{
      console.error("Date entered not valid format");
      return res.json({error: "Date entered not valid format"});
    }
  }
  catch(err){
    console.error(err);
    res.send({error: "No URL found for that id"});
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
