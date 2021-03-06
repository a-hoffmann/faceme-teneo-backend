

//let AssistantV1 = require('ibm-watson/assistant/v1');
const TIE = require('@artificialsolutions/tie-api-client');

// initialize a Teneo client for interacting with TeneoEengine
const {
  TENEO_ENGINE_URL
} = process.env;
const teneoEngineUrl = TENEO_ENGINE_URL;

const teneoApi = TIE.init(teneoEngineUrl);


let getTeneoResult = (text, conversationPayload, callback) => {

    console.log('getting Teneo result');
    /*let assistant = new AssistantV1({
        iam_apikey: '<API_KEY_HERE>',
        url: 'https://gateway-syd.watsonplatform.net/assistant/api',
        version: '2018-02-16'
    });*/
	
    console.log("text : " + text);
	var message = {text: text, channel: "facemein"} //create message object for use in TIE after

    let contextPayload = (typeof conversationPayload === 'undefined' || conversationPayload === '' || conversationPayload === null) ? JSON.parse("{}") : JSON.parse(conversationPayload);

    console.log("contextPayload : " + contextPayload);
//send input and get response

//await handleFacemeMessage()
	//instead of below
    handleFacemeMessage(sessionHandler, message)
        .then(result => {

            let speech = '';

            
                speech = result['text'] + "\n";
				
				
				
				

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

// initialise session handler, to store mapping between faceme 'channel' and engine session
const sessionHandler = SessionHandler();

// *** attach listeners to the event adapter ***

// *** send messages to Engine and handle response ***
/*
facemeEvents.on('message', (message, headers) => {

  // only deal with messages that have no subtype (plain messages) and that are not retries
  if (!message.subtype && !headers["x-faceme-retry-reason"]) {
    // handle initialization failure
    if (!faceme) {
      return console.error('No faceme webclient. Did you provide a valid SLACK_BOT_USER_ACCESS_TOKEN?');
    }
    // send message to engine an return answer
    handleFacemeMessage(sessionHandler, message);
  }
});*/

async function handleFacemeMessage(sessionHandler, message) {

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

    // construct faceme message with using the response from engine
    const facemeMessage = createFacemeMessage(message.channel, teneoResponse);


	return facemeMessage;
    // send message to faceme with engine output text
    //await sendFacemeMessage(facemeMessage);

  } catch (error) {
    console.error(`Failed when sending input to Teneo Engine @ ${teneoEngineUrl}`, error);
  }

}

// create faceme message
function createFacemeMessage(channel, teneoResponse) {

  // your bot can use output parameters to populate attachments
  // you would find those in teneoResponse.output.parameters
  const message = {};

  // populate base message
  message.text = teneoResponse.output.text;
  message.channel = 'facemeout';
  message.context = {instructions: {}}

  // check for attachment
  
  //TODO:
  //pass on extra instructions here:
  if (teneoResponse.output.parameters.emotionalTone) {
    try {
      message.context.instructions.emotionalTone = [JSON.parse(teneoResponse.output.parameters.emotionalTone)];
    } catch (error_parse) {
      console.error(`Failed when parsing output pm JSON`, error_parse);
    }
  }
  if (teneoResponse.output.parameters.expressionEvent) {
    try {
      message.context.instructions.expressionEvent = JSON.parse(teneoResponse.output.parameters.expressionEvent); 
	  //[] brackets are set in Studio if there are several instructions
    } catch (error_parse) {
      console.error(`Failed when parsing output pm JSON`, error_parse);
    }
  }
  if (teneoResponse.output.parameters.displayHtml) {
    try {
      message.context.instructions.displayHtml = JSON.parse(teneoResponse.output.parameters.displayHtml);
    } catch (error_parse) {
      console.error(`Failed when parsing output pm JSON`, error_parse);
    }
  }
  console.log("full instructive obj "+JSON.stringify(message.context));
  /*if (teneoResponse.output.parameters.faceme) {
    try {
      message.attachments = [JSON.parse(teneoResponse.output.parameters.faceme)];
    } catch (error_attach) {
      console.error(`Failed when parsing attachment JSON`, error_attach);
    }
  }*/
  return message
}

/* *
 * SESSION HANDLER
 * */
function SessionHandler() {

  // Map the faceme user id to the teneo engine session id. 
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
    getConverseResult: getTeneoResult,
    setEmotion: setEmotion

};