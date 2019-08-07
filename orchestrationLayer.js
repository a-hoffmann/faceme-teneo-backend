let server = new require("./server.js");
let nlp = new require("./nlp.js");
//test
let singleUseToken = new require("./singleUseToken.js")

//Handle the post request
let processPostRequest = (body, path, callback) =>
{
    console.log('Process ' + path);
    try {
        if (path == '/api/v1/teneo/converse') {
            body = JSON.parse(body);
			//return from nlp layer
            nlp.getConverseResult(body['fm-question'], body['fm-conversation'], (speech, instructions, conversationPayload) => {

                let avatarResponse = {'answer':speech, 'instructions':instructions};
                callback (JSON.stringify({ "answer": JSON.stringify(avatarResponse), "matchedContext": "", conversationPayload: JSON.stringify(conversationPayload) }));

            })

        }
		if (path == '/api/v1/watson/getSingleUseToken') {

            singleUseToken.getSingleUseToken((token) => {
                callback (token);
            });
		}
		else {
            callback("{}");
        }
    } catch (e) {
        console.log(e.toString());
        callback("{}");
    }
}

let startServer = (port) =>
{
    server.createServer(port, processPostRequest)
}

module.exports = {
    startServer: startServer
};