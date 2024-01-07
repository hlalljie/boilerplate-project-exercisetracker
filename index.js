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
      description: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        required: true
      },
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

app.use('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}));

// Save exercise record
app.post('/api/users/:_id/exercises', async (req, res) => {
  try{
    const foundUser = await userRecord.findById(req.params._id).exec();
    //foundUser.exercises.push({req.params.})
    //res.json(foundUser);
    // Continue if date input is valid date
    try{
      let exerciseDate;
      if (req.body.date == ""){
        exerciseDate = new Date();
      }
      else{
        exerciseDate = new Date(req.body.date);
      }
      let username = foundUser.username;
      foundUser.exercises.push({description: req.body.description, duration: req.body.duration, date: exerciseDate});
      foundUser.save();
      res.json({_id: req.params._id, username: username, date: exerciseDate.toDateString(), duration: req.body.duration, description: req.body.description});
    }
    catch(err){
      console.err("Date entered not valid format")
      res.json({error: "Date entered not valid format"});
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
