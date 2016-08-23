"use strict";

var request = require('request');
var http = require('http');
var express = require('express');
var app = express();

var pageview = false;

// kakuyomu
app.get(/^\/raw\/works\/\d{19}(\/episodes\/\d{19})?$/, function(req, res) {
    var path = req.path.slice("/raw".length);
    var url = "https://kakuyomu.jp" + path;
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
            if(pageview && path.match(/^\/works\/\d{19}\/episodes\/\d{19}$/)){
                request({
                    method: "POST",
                    url: url + "/read",
                    headers: {
                        'Accept': "*/*",
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: null
                });
            }
        }else if (!error && response.statusCode == 404) {
            res.status(404);
            res.end();
        }else{
            res.status(500);
            res.end();
            console.log(`error url:${url} code:${response.statusCode}`);
        }
    });
});

// aozora bunko
app.get(/^\/aozora\/cards\/\d{6}\/files\/\d{3}_\d{5}\.html$/, function(req, res) {
    var path = req.path.slice("/aozora".length);
    var url = "http://www.aozora.gr.jp" + path;
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        }else if (!error && response.statusCode == 404) {
            res.status(404);
            res.end();
        }else{
            res.status(500);
            res.end();
            console.log(`error url:${url} code:${response.statusCode}`);
        }
    });
});

app.use(express.static('public'));

app.get(/^\/works\/\d{19}(\/episodes\/(\d{19}|index)(\/\d{1,4})?)?$/, function(req, res) {
    res.sendFile(`${process.cwd()}/public/index.html`);
});

app.get(/.*/, function(req, res) {
    res.status(404).send('404 Not Found <a href="/">home</a>');
});

var server = app.listen(process.env.PORT || 8080, function() {
    console.log(`listening at port ${server.address().port}`);
});
