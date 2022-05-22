// [0, max)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

export default function randIndex(array) {
    return getRandomInt(0, array.length);
}
