'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const server = express();
server.use(bodyParser.json());

server.post('/', function (req, res) {
  console.log("in server...");
  // console.log('webhook request:',req.body);
  if (req.body.result.action == 'getSingleStock') {
    getSingleStock(req.body,res);
  }
  else {
    var speech = "An error has occured...";
    return res.json({
      speech: speech,
      displayText: speech
    });
  }
});

function getSingleStock (body, gRes) {
  var company = body.result.parameters.any;
  var options = { method: 'GET',
    url: 'https://www.blackrock.com/tools/hackathon/search-securities',
    qs: { identifiers: company }};


  request(options, function (error, response, body) {
    body = JSON.parse(body);
    console.log("1st single stock call",body);
    var peRatio = body.resultMap.SEARCH_RESULTS[0].resultList[1].peRatio;
    var previousClosePrice = body.resultMap.SEARCH_RESULTS[0].resultList[1].previousClosePrice;
    console.log("peRatio",peRatio);
    console.log("previousClosePrice",previousClosePrice);
    singleStockHelper(company,previousClosePrice,peRatio,gRes);
  });
}

function singleStockHelper(company,previousClosePrice,peRatio,gRes) {
  var options = {
    method: 'GET',
    url: 'https://test3.blackrock.com/tools/hackathon/performance',
    qs:
     { identifiers: company,
       outputDataExpression: 'resultMap[\'RETURNS\'][0].latestPerf',
       useCache: 'true' }
  };

  request(options, function (error, response, body) {
    var msg = company + "'s stock";
    msg += " has a previous close price of " + previousClosePrice;
    body = JSON.parse(body);
    var performance = (body.oneDay * 100).toFixed(2);
    console.log("performance",performance);
    if (performance < 0) {
        msg += " and decreased by ";
    } else {
        msg += " and went up by ";
    }
    msg += Math.abs(performance) + "%.";
    msg += " Its P/E ratio is " + peRatio;
    console.log("msg",msg);
    return gRes.json({
      speech: msg,
      displayText: msg
    });
  });
}

server.listen((process.env.PORT || 8000), function () {
  console.log('Server listening');
});
