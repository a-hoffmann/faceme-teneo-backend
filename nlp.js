

let AssistantV1 = require('ibm-watson/assistant/v1');
const TIE = require('@artificialsolutions/tie-api-client');

// initialize a Teneo client for interacting with TeneoEengine
const {
  TENEO_ENGINE_URL
} = process.env;
const teneoEngineUrl = TENEO_ENGINE_URL;

const teneoApi = TIE.init(teneoEngineUrl);


let getWatsonResult = (text, conversationPayload, callback) => {

    console.log('Inside old Watson');
    /*let assistant = new AssistantV1({
        iam_apikey: '<API_KEY_HERE>',
        url: 'https://gateway-syd.watsonplatform.net/assistant/api',
        version: '2018-02-16'
    });*/
	
    console.log("text : " + text);
	var message = {text: text} //create message object for use in TIE after

    let contextPayload = (typeof conversationPayload === 'undefined' || conversationPayload === '' || conversationPayload === null) ? JSON.parse("{}") : JSON.parse(conversationPayload);

    console.log("contextPayload : " + contextPayload);
//send input and get response

//await handleSlackMessage()
	//instead of below
    handleSlackMessage(sessionHandler, message)
        .then(result => {

            let speech = '';

            for (let text of result['text']) {
                speech = text + "\n";
            }

            //Pull out the instructions if they exist, otherwise return and empty JSON object.
            let instructions = result['context'].hasOwnProperty('instructions') ? result['context']['instructions'] : {};

            //Always clear out the old instructions otherwise if the NLP does not set them the same will be sent through again.
            let conversationPayload = result['context'];
            conversationPayload['instructions'] = {};

            callback(speech, instructions, conversationPayload)
        })
        .catch(err => {
                console.log(err);
        });
}

let setEmotion = (emotion) => {
    console.log("Emotion being set = " + emotion);
    emotionState = emotion;
}

// initialise session handler, to store mapping between slack 'channel' and engine session
const sessionHandler = SessionHandler();

// *** attach listeners to the event adapter ***

// *** send messages to Engine and handle response ***
/*
slackEvents.on('message', (message, headers) => {

  // only deal with messages that have no subtype (plain messages) and that are not retries
  if (!message.subtype && !headers["x-slack-retry-reason"]) {
    // handle initialization failure
    if (!slack) {
      return console.error('No slack webclient. Did you provide a valid SLACK_BOT_USER_ACCESS_TOKEN?');
    }
    // send message to engine an return answer
    handleSlackMessage(sessionHandler, message);
  }
});*/

async function handleSlackMessage(sessionHandler, message) {

  try {
    console.log(`Got message '${message.text}' from channel ${message.channel}`);

    // find engine session id mapped to channel id
    const sessionId = await sessionHandler.getSession(message.channel);

    // send message to engine using sessionId
    const teneoResponse = await teneoApi.sendInput(sessionId, {
      text: message.text
    });

    console.log(`Got Teneo Engine response '${teneoResponse.output.text}' for session ${teneoResponse.sessionId}`);

    // store mapping between channel and engine sessionId
    await sessionHandler.setSession(message.channel, teneoResponse.sessionId);

    // construct slack message with using the response from engine
    const slackMessage = createSlackMessage(message.channel, teneoResponse);


	return slackMessage;
    // send message to slack with engine output text
    //await sendSlackMessage(slackMessage);

  } catch (error) {
    console.error(`Failed when sending input to Teneo Engine @ ${teneoEngineUrl}`, error);
  }

}

// create slack message
function createSlackMessage(channel, teneoResponse) {

  // your bot can use output parameters to populate attachments
  // you would find those in teneoResponse.output.parameters
  const message = {};

  // populate base message
  message.text = teneoResponse.output.text;
  message.channel = channel;
  message.context = ''; //empty item for faceme, for now

  // check for attachment
  if (teneoResponse.output.parameters.slack) {
    try {
      message.attachments = [JSON.parse(teneoResponse.output.parameters.slack)];
    } catch (error_attach) {
      console.error(`Failed when parsing attachment JSON`, error_attach);
    }
  }
  return message
}

/* *
 * SESSION HANDLER
 * */
function SessionHandler() {

  // Map the slack user id to the teneo engine session id. 
  // This code keeps the map in memory, which is ok for testing purposes
  // For production usage it is advised to make use of more resilient storage mechanisms like redis
  const sessionMap = new Map();

  return {
    getSession: (userId) => new Promise((resolve, reject) => {
      if (sessionMap.size > 0) {
        resolve(sessionMap.get(userId));
      }
      else {
        resolve("")
      }
    }),
    setSession: (userId, sessionId) => new Promise((resolve, reject) => {
      sessionMap.set(userId, sessionId);
      resolve();
    })
  };
}
//AS CODE END

//exports
module.exports = {
    getConverseResult: getWatsonResult,
    setEmotion: setEmotion

};