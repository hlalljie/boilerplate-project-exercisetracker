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
    if (req.body.date == "" || req.body.date == null){
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
      
      // Show user with exercise fields added
      return res.send({_id: req.params._id, username: username, date: exerciseDate.toDateString(), duration: parseFloat(req.body.duration), description: req.body.description});
    }
    else{
      console.error("Date entered not valid format, you entered: " + req.body.date);
      return res.json({error: "Date entered not valid format"});
    }
  }
  catch(err){
    console.error(err);
    return res.send({error: "No user found for that id"});
  }
});

// Get user's excersise logs showing all exercises and count
app.get('/api/users/:_id/logs', async (req, res) => {

  try{
    let foundUser = await userRecord.findById(req.params._id).exec();
    // Map stored dates to readable strings
    exercisesDisplay = foundUser.exercises.map(({date, duration, description}) => ({date: date.toDateString(), duration, description}));
    
    count = exercisesDisplay.length;
    //console.log ("ex val: ", Date.parse(exercisesDisplay[0].date), " , from val: ", Date.parse(req.query.from))

    // Filter exercises based on from and to parameters
    exercisesDisplay = exercisesDisplay.filter((e) => 
      (!req.query.from || Date.parse(e.date) >= Date.parse(req.query.from)) &&
      (!req.query.to || Date.parse(e.date) <= Date.parse(req.query.to)));

    // Limit how many exercises are show based on the limit (get query parameter)
    if (req.query.limit){
      var displayLimit = parseInt(req.query.limit);
      exercisesDisplay = exercisesDisplay.slice(0, displayLimit);
    }
    
    // Show exercises
    return res.json({
      _id: foundUser._id,
      username: foundUser.username,
      count: count,
      from: req.query.from,
      show: displayLimit? displayLimit: "All",
      to: req.query.to,
      log: exercisesDisplay});    
  }
  catch(err){
    console.error(err);
    res.send({error: "No user found for that id"});
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
