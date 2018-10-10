'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');
require('dotenv').config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const { Client } = require('pg');

const pg_client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: true,
});

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();
app.use(bodyParser());

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.get('/api/:userId', (req, res) => {
  console.log(req.params)
  const problem = 1 // findRoomQuiz(findUserRoom(userId));
  res.header('Content-Type', 'application/json; charset=utf-8')
  return res.send({quiz: problem});
});
app.post('/post', (req, res) => {
  console.log('called')
  console.log({req: req.body})
  const base64 = req.body.image.split(',')[1];
  const decode = new Buffer.from(base64,'base64');
  const file_name = '/tmp/' + moment().format() + '.png';
  fs.writeFile(file_name, decode, (err) => {
      if(err){
          console.log(err)
      }else{
        cloudinary.v2.uploader.upload(file_name, 
          (result, error) => { console.log(result, error)});


          console.log('saved');
      }
  });
  return res.send({});
})
app.set("view engine", "ejs");
app.get("/", (req, res) => { res.render(__dirname + "/index"); })

pg_client.connect();
// event handler
function handleEvent(event) {
  console.log(event.source.userId);
	saveUserId(event.source.userId);
 	if(event.source.type == "group" || event.source.type == "room"){
		const id = event.source.type == "group" ? event.source.groupId : event.source.roomId;
		saveGroupId(id);
	}
	if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  const echo = { type: 'text', text: event.message.text };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

const saveUserId = (userId) => {
	const sql = `INSERT INTO users (user_id) VALUES('${userId}') RETURNING *`;
	pg_client.query(sql, (err, res) => {
		console.log(err ? `already inserted user_id ${userId}` : res.rows[0])
	})
}

const saveGroupId = (groupId) => {
	const sql = `INSERT INTO groups (group_id) VALUES('${groupId}') RETURNING *`;
	pg_client.query(sql, (err, res) => {
		console.log(err ? `already inesrted group_id ${groupId}` : res.rows[0])
	})
}
