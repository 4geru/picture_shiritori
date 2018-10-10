'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');
const cloudinary = require('cloudinary');

require('dotenv').config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const { Client } = require('pg');

const postgres = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: true,
});

// create Express app
// about Express itself: https://expressjs.com/
const app = express();
app.use(bodyParser());

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
        cloudinary.v2.uploader.upload(file_name, (req, result) => {
          const user_id = 'U710c26a12186326e3d3b79924cc98a3a';
          const group_id = 'C0ee1b32115434bb29ee42d73513bc66f';
          saveImage('title', result.secure_url, group_id, user_id)
        });
      }
  });
  return res.send({});
})
app.set("view engine", "ejs");
app.get("/", (req, res) => { res.render(__dirname + "/index"); })

postgres.connect();

// listen on port
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

const saveImage = (title, url, groupId, userId) => {
  // group userのidを取得
  let sql = `select users.id as uid, groups.id as gid from users, groups where user_id = '${userId}' and group_id = '${groupId}';`
  console.log(sql)
  postgres.query(sql, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      const gu = res.rows[0];
      // group_usersを取得
      sql = `SELECT * FROM group_users WHERE user_id = ${gu.uid} and group_id = ${gu.gid}`;
      console.log(sql)
      postgres.query(sql, (err, res) => {
        const result = res.rows[0];
        // imageを登録
        console.log(err ? `already inesrted group_user_id ${result.gid}, ${result.uid}` : res.rows[0])
        sql = `INSERT INTO images (title, url, group_user_id) VALUES('${title}', '${url}', ${result.id}) RETURNING *`;
        console.log(sql)
        postgres.query(sql, (err, res) => {
          console.log(err ? `already inesrted group_id ${groupId}` : res.rows[0])
        })
      })
    }
  })
}
