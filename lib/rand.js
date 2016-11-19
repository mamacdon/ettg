module.exports.randRange = randRange;
module.exports.randIndex = randIndex;

function randRange(min, max) {
    return Math.floor(Math.random()*max + min);
}

function randIndex(array) {
    return randRange(0, array.length);
}
