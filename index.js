const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URL;
var ObjectId = require('mongodb').ObjectId; 

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(error => {
  if (error){
    return console.error(error);
  }
  console.log("Connected to MongoDB successfully");
});

const collection = client.db("freeCodeCamp").collection("exerciseTracker");

async function createNewUser(username){
  const user = {
    username: username,
    log: []
  }
  await collection.insertOne(user, (error, res) => {
    if (error){
      return console.error(error);
    }
  });
  return {
    username: user.username,
    _id: user._id
  };
};

async function getAllUsers(){
  const cursor = await collection.find().toArray();
  const allUsers = cursor.map((item) => {
    return {
      _id: item._id,
      username: item.username
    }
  });
  return allUsers;
};

async function addExercise(_id, description, duration, date){
  const query = {_id: new ObjectId(_id)};
  const update = {
    $push:{
      log: {
        description: description,
        duration: duration, 
        date: date
      }
    }
  };
  const updatedUser = await collection.findOneAndUpdate(query, update, {returnDocument: "after"});
  return {
    _id: _id,
    username: updatedUser.value.username,
    date: date.toDateString(),
    duration: duration,
    description: description
  };
};

async function getLogs(_id){
  const user = await collection.findOne(
    {
      _id: new ObjectId(_id)
    }
  );
  return user.log;
};

async function getUserLog(_id, from, to, limit){
  const document = await collection.findOne({_id: new ObjectId(_id)});
  let log;
  if (from && to){
    let fromDate = new Date(from);
    let toDate = new Date(to);
    log = document.log.filter((item) => {
      let itemDate = new Date(item.date);
      if (itemDate >= fromDate && itemDate < toDate){
        return item;
      }
    });
  }
  else{
    log = document.log;
  }
  if (limit){
    log = log.slice(0, limit);
  }
  log = log.map((item) => {
    return {
      description: item.description,
      duration: item.duration,
      date: new Date(item.date).toDateString()
    }
  });
  return {
    log: log,
    count: log.length
  };
};

app.use(cors());
app.use(express.urlencoded({extended:true})); // body-parsing middleware

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const user = await createNewUser(username);
  res.json(user);
});

app.get('/api/users', async (req, res) => {
  const allUsers = await getAllUsers();
  res.send(allUsers); // sends the array containing all users
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const _id = req.params._id;
  const description = req.body.description;
  const duration = Number(req.body.duration);
  let date;
  console.log(`_id: ${_id}, date: ${req.body.date}`);
  if (!req.body.date){
    date = new Date();
  }
  else{
    date = new Date(req.body.date);
  }
  const updatedUser = await addExercise(_id, description, duration, date);
  res.json(updatedUser);
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const _id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  // console.log(`from: ${from}, to: ${to}, limit: ${limit}`);
  const userLog = await getUserLog(_id, from, to, limit);
  res.json(userLog);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
