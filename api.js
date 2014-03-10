var request = require('request')
  , xml2js = require('xml2js')
  , _ = require('lodash')
  , crypto = require('crypto')
  , defaultLogger =
    { info: console.log
    , error: console.error
    , debug: console.log
    , warn: console.warn
    }

module.exports = function (options) {
  // Default options to an object if not passed through
  options = options || {}

  var baseUrl = options.baseUrl || 'http://trial.bbvms.com'
    , logger = options.logger || defaultLogger

  var getRandom = function (callback) {
    var parser = new xml2js.Parser()

    logger.debug('Getting random token for authentication')
    request(
      { url: baseUrl + '/api/getRandom'
      , method: 'GET'
      , jar: true
      }, function (error, response, body) {
        if (error) {
          logger.error(error)
          return callback(error)
        }

        parser.addListener('end', function (xml) {
          logger.debug(xml)
          if (xml.response && xml.response._) {
            logger.info('Token:', xml.response._)
            callback(null, xml.response._)
          } else {
            callback('XML structure not as expected')
          }
        })

        try {
          parser.parseString(body)
        } catch (e) {
          callback(e)
        }
      }
    )
  }

  var authenticate = function (username, password, token, callback) {
    var parser = new xml2js.Parser()
      , md5Password = crypto.createHash('md5').update(password).digest('hex')
      , firstPass = new Buffer(md5Password).toString('base64') + token
      , secondPass = crypto.createHash('md5').update(firstPass).digest('hex')
      , authHash = new Buffer(secondPass).toString('base64')

    request(
      { url: baseUrl + '/api/bbauth'
      , qs:
        { action: 'get_user'
        , username: username
        , password: authHash
        }
      , method: 'GET'
      , jar: true
      }, function (error, response, body) {
        if (error) return callback(error)

        parser.addListener('end', function (xml) {
          // Authentication has failed
          if (xml.response && xml.response.$.code === '404') {
            return callback('No user context or user is not authenticated')
          }

          callback(null, xml.user)
        })

        try {
          parser.parseString(body)
        } catch (e) {
          callback(e)
        }
      }
    )
  }

  var checkSession = function (callback) {
    var parser = new xml2js.Parser()

    request(
      { url: baseUrl + '/api/bbauth'
      , qs: { action: 'checkSession' }
      , method: 'GET'
      , jar: true
      }, function (error, response, body) {
        if (error) {
          logger.error(error)
          return callback(error)
        }

        parser.addListener('end', function (xml) {
          logger.debug(xml)
          if (xml.response) {
            if (xml.response.$.code === '200') {
              return callback(null, true)
            } else if (xml.response.$.code === '404') {
              return callback(null, false)
            }
          }

          return callback('XML structure not as expected')
        })

        try {
          parser.parseString(body)
        } catch (e) {
          callback(e)
        }
      }
    )
  }

  var logOff = function (callback) {
    var parser = new xml2js.Parser()

    request(
      { url: baseUrl + '/api/bbauth'
      , qs: { action: 'logoff' }
      , method: 'GET'
      , jar: true
      }, function (error, response, body) {
        if (error) {
          logger.error(error)
          return callback(error)
        }

        parser.addListener('end', function (xml) {
          logger.debug(xml)
          if (xml.response && xml.response.$.code === '200') {
            callback(null)
          } else {
            callback('XML structure not as expected')
          }
        })

        try {
          parser.parseString(body)
        } catch (e) {
          callback(e)
        }
      }
    )
  }

  var search = function (query, callback) {
    var queryString = ''

    if (query) {
      queryString += query + ' AND '
    }

    request(
      { url: baseUrl + '/json/search'
      , qs:
        { query: queryString + 'status:published'
        //, sort: 'createddate'
        , limit: 50
        }
      , method: 'GET'
      , json: true
      , jar: true
      }, function (error, response, body) {
        logger.debug('Query:', queryString + 'status:published')
        if (error) {
          logger.error(error)
          return callback(error)
        }

        if (body === null || typeof body !== 'object') {
          return callback('Response was not valid JSON')
        }

        if (!body.items) {
          return callback(null, [])
        }

        body.items.forEach(function (result) {
          result.assets = JSON.parse(result.assets)
          result.thumbnails = JSON.parse(result.thumbnails)
        })

        callback(error, body.items)
      }
    )
  }

  var getImageUrl = function (width, height, image) {
    return baseUrl + '/image/' + width + '/' + height + image
  }

  var getJsPlayer = function (clipId, playoutId) {
    playoutId = playoutId || 'default'
    return baseUrl + '/p/' + playoutId + '/c/' + clipId + '.js'
  }

  return {
    getRandom: getRandom
  , authenticate: authenticate
  , checkSession: checkSession
  , logOff: logOff
  , search: search
  , getImageUrl: getImageUrl
  , getJsPlayer: getJsPlayer
  }
}
