var express = require('express')
  , app = express()
  , fs = require('fs')

app.get('/api/getRandom', function (req, res) {
  var content = app.get('get-random-content')
    , contentType = content.split('.')[1]

  res.header('Content-Type', 'application/' + contentType)
  res.sendfile(__dirname + content)
})

app.get('*', function (req, res) {
  var content = app.get('content')
    , contentType = content.split('.')[1]

  res.header('Content-Type', 'application/' + contentType)
  res.sendfile(__dirname + content)
})

app.listen(3001)

module.exports = app