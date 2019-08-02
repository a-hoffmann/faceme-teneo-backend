let orchestrationLayer = require("./orchestrationLayer.js");
let singleUseToken = require("./singleUseToken.js");

const {
	SINGLEUSETOKEN_PORT,
  OLAYER_PORT
} = process.env;


singleUseToken.startServer(SINGLEUSETOKEN_PORT);
orchestrationLayer.startServer(OLAYER_PORT);

console.log("Now running on "+OLAYER_PORT);