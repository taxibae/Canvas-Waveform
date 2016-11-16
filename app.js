var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({
    extended : false
}));
app.use(express.static('public'));

//Event Listener

//Routing
app.get('/gettingmusic/:name', function(req, res) {
    console.log('gettingmusic req called');
    res.set({'Content-Type': 'audio/mp3'});
    var readStream = fs.createReadStream('public/audio/'+req.params.name);
    readStream.on('close', function () {
        console.log('Stream is closed well');
    });
    readStream.on('error', function (error) {
        console.log(error);
        res.send(undefined);
    });
    readStream.pipe(res);
});

app.listen(52273, function () {
    console.log('Server Running at 52273');
});
