const Chance = require("chance");
const chance = new Chance();

module.exports = randIndex;

function randIndex(array) {
    return chance.integer({ min: 0, max: array.length - 1 });
}