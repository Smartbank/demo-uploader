var express = require('express');
var multer = require('multer');
var spawn   = require('child_process').exec;

var args = process.argv.slice(2);
var storage = multer.diskStorage({
    destination: __dirname + args[0],
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
});

var upload = multer({storage: storage});

var app = express();

app.route('/upload').post(upload.fields([
    {
        name: 'dist'
    }, {
        name: 'source'
    },
]), function(req, res, next) {
    var command = spawn(__dirname + '/' + args[1]);
    var output = [];

    command.on('error', function(err) {
        res.send(err);
    });

    command.stdout.on('data', function(chunk) {
        output.push(chunk);
    });

    command.on('close', function(code) {
        if (code === 0) {
            res.status(200)
            output.forEach(function (chunk) {
                res.send(chunk);
            });
        } else {
            res.status(500); // when the script fails, generate a Server Error HTTP response
        }
        res.end();
    });
});

var server = app.listen(7777, function() {
    console.log('Listening on port %d', server.address().port);
});
