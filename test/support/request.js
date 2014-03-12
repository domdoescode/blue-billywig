var request = require('request')

module.exports = function (url, error, body) {
  return function (options, callback) {
    if (options.url === url) {
      callback(new Error(error), {}, body)
    } else {
      request(options, callback)
    }
  }
}