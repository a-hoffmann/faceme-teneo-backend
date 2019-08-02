let jwt = require('jwt-simple');
let request = require('request');
let server = new require("./server.js");

const baseUrl = 'https://dal-eeva.faceme.com';
const tokenEndpoint = '/api/v1/clients/access/tokens/';
const apiKey = '6f734995-1cb3-4d9x-y7bx-72a891880d24';
const customerJwtSecret = 'c90b1c33-39e5-482x-yd4x-330a0342831a';

//Handle the post request
let processPostRequest = (body, path, callback) =>
{
    console.log('Process ' + path);
    try {
        if (path == '/api/v1/watson/getSingleUseToken') {

            getSingleUserToken((token) => {
                callback (token);
            });

        } else {
            callback({});
        }
    } catch (e) {
        console.log(e.toString());
        callback({});
    }
}

let getSingleUserToken = (callback) => {

    let payload = {
        'sid': '',
        'fm-custom-data': '',
        'fm-workspace': '67cbbb50-42c0-44ad-992b-c99ef375d5c1'
    };

    let token = jwt.encode(payload, customerJwtSecret);

    request.post({
        url: baseUrl + tokenEndpoint,
        headers: {
            'faceme-api-key': apiKey,
            'Content-Type': 'application/jwt'
        },
        body: token,
        method: 'POST'
    }, (err, resp, body) => {
        if (err) {
            console.log(err)
            console.log(body)
            callback("")
        } else {
            console.log('Response: ' + body);

            let rt = JSON.parse(body);
            if (rt.hasOwnProperty('status'))
            {
                callback('Status:' + rt.status + ", Message: " + rt.message);
            } else {
                callback(JSON.parse(body).token);
            }

        }
    });
}

let startServer = (port) =>
{
    server.createServer(port, processPostRequest)
}

module.exports = {
    startServer: startServer
};