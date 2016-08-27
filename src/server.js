"use strict";

var request = require('request');
var http = require('http');
var express = require('express');
var app = express();

var pageview = true;

// kakuyomu
app.get(/^\/raw\/works\/\d{19}(\/episodes\/\d{19})?$/, function(req, res) {
    var path = req.path.slice("/raw".length);
    var url = "https://kakuyomu.jp" + path;
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
            if (pageview && path.match(/^\/works\/\d{19}\/episodes\/\d{19}$/)) {
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
        } else if (!error && response.statusCode == 404) {
            res.status(404);
            res.end();
        } else {
            res.status(500);
            res.end();
            console.log(`error url:${url} code:${res.statusCode}`);
        }
    });
});

// aozora bunko
app.get(/^\/raw\/aozora\/cards\/\d+\/files\/\d+_\d+\.html$/, function(req, res) {
    var path = req.path.slice("/raw/aozora".length);
    http.get({
            hostname: 'www.aozora.gr.jp',
            port: 80,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
            }
        },
        function(r) {
            var data = [];
            r.setEncoding('binary');
            r.on('data', (chunk) => {
                data.push(new Buffer(chunk, 'binary'));
            });
            r.on('end', () => {
                var img = Buffer.concat(data);
                res.write(img);
                res.end();
            });
        }).on('error', (e) => {
            console.log(e.message);
        }
    );
});

app.use(express.static('public'));

app.get(/^\/works\/\d{19}(\/episodes\/(\d{19}|index)(\/\d{1,4})?)?$/, function(req, res) {
    res.sendFile(`${process.cwd()}/public/index.html`);
});

app.get(/.*/, function(req, res) {
    res.status(404).send('404 Not Found <a href="/">home</a>');
});

var server = app.listen(process.env.PORT || 8080, function() {
    var host = server.address().address;
    var port = server.address().port;
    if(process.env["pageview"] === "false"){
        pageview = false;
        console.log(`page view posting is disabled.`);
    }
    console.log(`listening at port ${port}`);
});
