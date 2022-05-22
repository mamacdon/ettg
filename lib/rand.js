const { randomInt } = require('crypto');

/** integer in the range [0, array.length) */
module.exports = function randIndex(array) {
    return randomInt(array.length);
};