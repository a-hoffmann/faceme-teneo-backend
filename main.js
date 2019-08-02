let orchestrationLayer = require("./orchestrationLayer.js");
let singleUseToken = require("./singleUseToken.js");

const ol = OLAYER_PORT.process.env
const sut = SINGLEUSETOKEN_PORT.process.env

singleUseToken.startServer(sut);
orchestrationLayer.startServer(ol);



console.log("Now running on "+ol);