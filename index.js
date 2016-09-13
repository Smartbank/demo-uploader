var express = require('express');
var multer = require('multer');
var spawn   = require('child_process').exec;

var args = process.argv.slice(2);
var uploadDir = __dirname + '/' + args[0];
console.log('Uploading files to', uploadDir);
var storage = multer.diskStorage({
    destination: uploadDir,
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({storage: storage});
var app = express();

var output, status;
var deployPromise = new Promise(resolve => resolve());

function startDeploy() {

    deployPromise = new Promise((resolve, reject) => {
        var deployCommand = spawn(__dirname + '/' + args[1]);
        output = [];
        status = 'in-progress';

        deployCommand.on('error', err => {
            console.log(err);
            output.push(err);
        });

        deployCommand.stdout.on('data', chunk => {
            console.log(chunk);
            output.push(chunk);
        });

        deployCommand.stderr.on('data', chunk => {
            console.log(chunk);
            output.push(chunk);
        });

        deployCommand.on('close', (code, signal) => {
            if (code === 0) {
                console.log('Deploy Script Completed!');
                output.push('Deploy Script Completed!\n');
                status = 'success';
            } else {
                console.log('Deploy Scripted Failed!, with code: ' + code + ' and signal: ' + signal);
                output.push('Deploy Scripted Failed!, with code: ' + code + ' and signal: ' + signal + '\n');
                status = 'failed';
            }
        });
    }).catch(() => {});
}

app.route('/upload').post(upload.fields([
    {
        name: 'dist'
    }, {
        name: 'source'
    },
]), function(req, res, next) {
    console.log('File uploaded, starting deploy');
    startDeploy();
    res.status(200).send('File uploaded, starting deploy');
});

app.route('/status').get((req, res) => {
    console.log('status called, awaiting deploy promise');
    deployPromise.then(() => {
        console.log('deploy promise resolved, resolving request');
        res.status(status === 'success' ? 200 : 500).send(output && output.join(''));
    });
});

var server = app.listen(7777, () => {
    console.log('Listening on port %d', server.address().port);
});
