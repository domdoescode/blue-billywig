var xml2js = require('xml2js')
  , crypto = require('crypto')
  , defaultLogger = require('bland')
  , request = require('request')

module.exports = function (options) {
  // Default options to an object if not passed through
  options = options || {}

  var baseUrl = options.baseUrl || 'http://trial.bbvms.com'
    , logger = options.logger || defaultLogger
    , requestDelegate = options.request || request

  /*
   * Get a token from Blue Billywig for use when hashing the authentication
   * request.
   */
  var _getRandom = function (callback) {
    logger.info('Getting random token for authentication')

    var parser = new xml2js.Parser()

    requestDelegate(
      { url: baseUrl + '/api/getRandom'
      , method: 'GET'
      , jar: true
      }, function (error, response, body) {
        if (error) {
          logger.error(error.message)
          return callback(error)
        }

        parser.addListener('end', function (xml) {
          logger.debug(xml)
          if (xml.response && xml.response._) {
            logger.info('Token:', xml.response._)
            callback(null, xml.response._)
          } else {
            callback(new Error('XML structure not as expected'))
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

  /*
   * Creates a session for the user, if username and password are correct.
   */
  var authenticate = function (username, password, callback) {
    logger.info('Authenticating user', username)

    _getRandom(function (error, token) {
      if (error) return callback(error)

      var parser = new xml2js.Parser()
        , md5Password = crypto.createHash('md5').update(password).digest('hex')
        , firstPass = new Buffer(md5Password).toString('base64') + token
        , secondPass = crypto.createHash('md5').update(firstPass).digest('hex')
        , authHash = new Buffer(secondPass).toString('base64')

      requestDelegate(
        { url: baseUrl + '/api/bbauth'
        , qs:
          { action: 'get_user'
          , username: username
          , password: authHash
          }
        , method: 'GET'
        , jar: true
        }, function (error, response, body) {
          if (error) {
            logger.error(error.message)
            return callback(error)
          }

          parser.addListener('end', function (xml) {
            // Authentication has failed
            if (xml.response && xml.response.$.code === '404') {
              return callback(new Error('No user context or user is not authenticated'))
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
    })
  }

  /*
   * Checks if a session for the user exists (if they are logged in).
   */
  var checkSession = function (callback) {
    logger.info('Checking if Blue Billywig session exists')

    var parser = new xml2js.Parser()

    requestDelegate(
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

          return callback(new Error('XML structure not as expected'))
        })

        try {
          parser.parseString(body)
        } catch (e) {
          callback(e)
        }
      }
    )
  }

  /*
   * Call when session exists to destroy it. If a session does not exist, it
   * will throw an error.
   */
  var logOff = function (callback) {
    logger.info('Logging out user')

    var parser = new xml2js.Parser()

    requestDelegate(
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
            callback(new Error('XML structure not as expected'))
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

  /*
   * Query is an object that will be used in the query string contructed by
   * request. This means the documentation provided by Blue Billywig can be used
   * to determine how to search, and should make it always compatible.
   */
  var search = function (query, callback) {
    logger.info('Searching Blue Billywig for', query.query)

    requestDelegate(
      { url: baseUrl + '/json/search'
      , qs: query
      , method: 'GET'
      , json: true
      , jar: true
      }, function (error, response, body) {
        logger.debug('Query:', query)
        if (error) {
          logger.error(error)
          return callback(error)
        }

        if (body === null || typeof body !== 'object') {
          return callback(new Error('Response was not valid JSON'))
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
    authenticate: authenticate
  , checkSession: checkSession
  , logOff: logOff
  , search: search
  , getImageUrl: getImageUrl
  , getJsPlayer: getJsPlayer
  }
}
