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

async function getUser(_id, from, to, limit){
  let query;
  let user;
  if (from === undefined && to === undefined){
    query = {_id: new ObjectId(_id)};
    if (limit === undefined){
      user = await collection.find(query);
    }
    else{
      user = await collection.find(query).limit(Number(limit));
    }
  }
  else{
    if (from != undefined && to != undefined){
      query = {
        _id: new ObjectId(_id),
        log: {
          date: {
            $gte: new Date(from),
            $lt: new Date(to)
          }
        }
      };
    }
    else if (from === undefined && to != undefined){
      query = {
        _id: new ObjectId(_id),
        log: {
          date: {
            $lt: new Date(to)
          }
        }
      };
    }
    else{
      query = {
        _id: new ObjectId(_id),
        log: {
          date: {
            $gte: new Date(from)
          }
        }
      };
    }
    if (limit === undefined){
      user = await collection.find(query);
    }
    else{
      user = await collection.find(query).limit(Number(limit));
    }
  }
  return user;
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
  if (req.body.date === ""){
    date = new Date();
  }
  else{
    date = new Date(req.body.date);
  }
  const updatedUser = await addExercise(_id, description, duration, date);
  res.json(updatedUser);
});

app.get('/api/users/:_id/logs/:from?/:to?/:limit?', async (req, res) => {
    console.log(`from: ${req.params.from}, to: ${req.params.to}, limit: ${req.params.limit}`);
  const from = req.params.from;
  const to = req.params.to;
  const limit = req.params.limit;
  const _id = req.params._id;
  const user = await getUser(_id, from, to, limit);
  const count = user.log.length;
  res.json({
    _id: _id,
    username: user.username,
    count: count,
    log: user.log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
