let orchestrationLayer = require("./orchestrationLayer.js");
let singleUseToken = require("./singleUseToken.js");

const {
	SINGLEUSETOKEN_PORT,
  OLAYER_PORT
} = process.env;


singleUseToken.startServer(SINGLEUSETOKEN_PORT || 3030);
orchestrationLayer.startServer(OLAYER_PORT || 3000);

console.log("Now running on "+OLAYER_PORT);