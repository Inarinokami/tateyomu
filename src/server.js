var request = require('request');
var cheerio = require('cheerio');
var http = require('http');
var express = require('express');

var app = express();

app.get(/^\/raw\/\d{19}\/episodes\/\d{19}$/, function(req, res) {
    var url = "https://kakuyomu.jp/works" + req.path.slice("/raw".length);
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        }else if (!error && response.statusCode == 404) {
            res.status(404);
            res.end();
        }else{
            console.log(url);
            console.log(error);
            console.log(response.statusCode);
        }
    });
});

app.get(/^\/works\/\d{19}\/episodes\/\d{19}$/, function(req, res) {
    res.sendFile(`${process.cwd()}/public/index.html`);
});

app.use(express.static('public'));

app.use(function(req, res, next) {
    res.status(404);
    res.sendFile(`${process.cwd()}/public/404.html`);
});


var server = app.listen(8080, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});
