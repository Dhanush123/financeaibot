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
  else if (req.body.result.action == 'compareTwoStocks') {
    compareTwoStocks(req.body,res);
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
    console.log("1st single stock call",body.resultMap.SEARCH_RESULTS[0].resultList[0]);
    var peRatio = body.resultMap.SEARCH_RESULTS[0].resultList[0]["peRatio"];
    var previousClosePrice = body.resultMap.SEARCH_RESULTS[0].resultList[0]["previousClosePrice"];
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
    if (previousClosePrice && peRatio) {
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
    }
    else {
      var msg = company + "'s stock";
      body = JSON.parse(body);
      var performance = (body.oneDay * 100).toFixed(2);
      console.log("performance",performance);
      if (performance < 0) {
          msg += " decreased by ";
      } else {
          msg += " went up by ";
      }
      msg += Math.abs(performance) + "%.";
      console.log("msg",msg);
      return gRes.json({
        speech: msg,
        displayText: msg
      });
    }
  });
}

function compareTwoStocks(body,gRes) {
  var company1 = body.result.parameters.any1;
  var company2 = body.result.parameters.any2[0];
  console.log(company1,company2);
  var performance1 = 0;
  var performance2 = 0;
  var options1 = {
    method: 'GET',
    url: 'https://test3.blackrock.com/tools/hackathon/performance',
    qs:
     { identifiers: company1,
       outputDataExpression: 'resultMap[\'RETURNS\'][0].latestPerf',
       useCache: 'true'
     }
  };
  request(options1, function (error1, response1, body1) {
    body1 = JSON.parse(body1);
    console.log("body1",body1);
    performance1 =  (body1.oneDay * 100).toFixed(2);
    console.log("performance1",performance1);
    twoStocksHelper(company1,company2,performance1,performance2,gRes);
  });
}

function twoStocksHelper(company1,company2,performance1,performance2,gRes) {
  console.log("inside twoStocksHelper");
  var options2 = {
    method: 'GET',
    url: 'https://test3.blackrock.com/tools/hackathon/performance',
    qs:
     { identifiers: company2,
       outputDataExpression: 'resultMap[\'RETURNS\'][0].latestPerf',
       useCache: 'true'
     }
  };
  request(options2, function (error, response, body) {
    body = JSON.parse(body);
    console.log("body2",body);
    performance2 =  (body.oneDay * 100).toFixed(2);
    console.log("performance2",performance2);
    var msg = "";
    if(performance2 > performance1){
      msg = company2 + " at " + performance2 +"%" + " is doing better than " + company1 + " by " + (performance2-performance1) + "%. You should invest in " + company2;
    }
    else {
      msg = company1 + " at " + performance1 +"%" + " is doing better than " + company2 + " by " + (performance1-performance2) + "%. You should invest in " + company1;
    }
    return gRes.json({
      speech: msg,
      displayText: msg
    });
  });
}

server.listen((process.env.PORT || 8000), function () {
  console.log('Server listening');
});
