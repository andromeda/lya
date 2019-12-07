const _ = require("lodash");

function message()
{
    console.log("Some message");
}

_.delay(message, 150);
console.log("Some other message");

const vals = [1, 2, 'good', [1, 2], {name: 'Peter', age: 32}];

vals.forEach( (e) => {

    if (_.isNumber(e)) {
        console.log(`${e} is a number`);
    }

    if (_.isString(e)) {
        console.log(JSON.stringify(e) + ' is a string');
    }

    if (_.isArray(e)) {
        console.log(JSON.stringify(e) + ' is an array');
    }

    if (_.isObject(e)) {
        console.log(JSON.stringify(e) + ' is an object');
    }

});

const nums = [657, 122, 3245, 345, 99, 18];

nums.forEach( e => {

    console.log(_.padStart(e.toString(), 20, '.'));
});

let p = {age: 24, name: "Rebecca", occupation: "teacher"};

const keys = _.keys(p);
console.log(keys);

const values = _.values(p);
console.log(values);

p = {age: 24, name: "Rebecca", occupation: "teacher"};

_.forIn(p, (value, key) => {

    console.log(`${key}: ${value}`);
})