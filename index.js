'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const server = express();
server.use(bodyParser.json());

server.post('/', function (req, res) {
  console.log('webhook request:',req.body);
  if (req.body.result.action == 'NAMEHERE') {
    auth(req.body,res);
  }
  else {
    var speech = "An error has occured...";
    return res.json({
      speech: speech,
      displayText: speech
    });
  }
});

server.listen((process.env.PORT || 8000), function () {
  console.log('Server listening');
});
