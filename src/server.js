var request = require('request');
var http = require('http');
var express = require('express');
var app = express();

var pageview = false;

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

app.use(express.static('public'));

app.get(/.*/, function(req, res) {
    res.sendFile(`${process.cwd()}/public/index.html`);
});

var server = app.listen(process.env.PORT || 8080, function() {
    console.log(`listening at http://localhost:${server.address().port}`);
});
