var request = require('request');
var http = require('http');
var express = require('express');
var app = express();

app.get(/^\/raw\/works\/\d{19}(\/episodes\/\d{19})?$/, function(req, res) {
    var url = "https://kakuyomu.jp" + req.path.slice("/raw".length);
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

app.get(/.*/, function(req, res) {
    res.sendFile(`${process.cwd()}/public/index.html`);
});

var server = app.listen(process.env.PORT || 8080, function() {
    console.log(`listening at http://localhost:${server.address().port}`);
});
