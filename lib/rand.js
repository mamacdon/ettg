module.exports.randRange = randRange;

function randRange(min, max) {
    return Math.floor(Math.random()*max + min);
}

//  @returns {Array} A copy of array which has been jumbled up a bit
// module.exports.shuffle = function(array) {
//     var copy = [].concat(array);
//     for (var i=0; i < array.length; i++) {
//         var j = randRange(0, array.length);
//         var tmp = copy[i];
//         copy[i] = copy[j];
//         copy[j] = tmp;
//     }
//     return copy;
// }