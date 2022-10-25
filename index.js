const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URL;

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
    exercises: []
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
}

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
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
