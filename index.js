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

// Save exercise record


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
