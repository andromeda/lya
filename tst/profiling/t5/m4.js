console.log('This is m4');
const loop = (time) => {
  let start = new Date();
  for (var i = 0; i < 10000000000; i++) {
    if ((new Date() - start) > time) {
      break;
    }
    let y = 0;
  };
};

module.exports = {
  loop: loop,
}
