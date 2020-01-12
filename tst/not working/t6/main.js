const mod1 = require("./mod1.js");
const mod2 = require("./mod2.js");
const mod3 = require("./mod3.js");
const mod4 = require("./mod4.js");

/**
 * Runs mod1 which will loop and randomly call either mod3 (50%) or mod4 (50%)
 *
 * Runs mod2 which will loop and randomly call either mod3 (75%) or mod4 (25%)
 *
 */

mod1.run();
mod2.run();