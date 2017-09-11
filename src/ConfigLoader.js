module.exports = function() {
  try {
    return require('../config/config.json');
  } catch (e) {
    console.error(e);
    return { };
  }
};