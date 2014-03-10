var noop = function () {}
  , noLogger = require('mc-logger')
  , options =
    { logger: noLogger
    , baseUrl: 'http://localhost:3001'
    }
  , should = require('should')
  , BlueBillywig = require('../api')

  , app = require('./support/app')

describe('getRandom()', function () {
  it('should return a random token', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/get-random/success.xml')

    blueBillywig.getRandom(function (error, token) {
      if (error) return done(error)

      should.exist(token)
      token.should.equal('m4wfp13jzd')
      done()
    })
  })

  it('should error correctly', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/get-random/failure.xml')

    blueBillywig.getRandom(function (error, token) {
      if (error) {
        error.should.equal('XML structure not as expected')
        return done()
      }

      done('Error should have been returned')
    })
  })

  it('should fail gracefully with invalid XML', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/broken.xml')

    blueBillywig.getRandom(function (error, token) {
      if (error) return done()

      done('Error should have been returned')
    })
  })
})

describe('authenticate()', function () {
  it('should return a user when authenticated successfully', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/authenticate/success.xml')

    blueBillywig.authenticate('dom', 'ac3', 't0k3n', function (error, user) {
      if (error) return done(error)

      should.exist(user)
      should.equal('D.Udall', user['$'].name)
      done()
    })
  })

  it('should error when a user is not authenticated', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/authenticate/failure.xml')

    blueBillywig.authenticate('dom', 'ac3', 't0k3n', function (error, user) {
      if (error) return done()

      done('Error should have been returned')
    })
  })

  it('should fail gracefully with invalid XML', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/broken.xml')

    blueBillywig.authenticate('dom', 'ac3', 't0k3n', function (error, user) {
      if (error) return done()

      done('Error should have been returned')
    })
  })
})

describe('checkSession()', function () {
  it('should return true if session exists', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/check-session/session-exists.xml')

    blueBillywig.checkSession(function (error, sessionExists) {
      if (error) return done(error)

      should.equal(true, sessionExists)
      done()
    })
  })

  it('should return false if session does not exist', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/check-session/session-does-not-exist.xml')

    blueBillywig.checkSession(function (error, sessionExists) {
      if (error) return done(error)

      should.equal(false, sessionExists)
      done()
    })
  })

  it('should fail gracefully with unknown response code', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/check-session/unknown-response-code.xml')

    blueBillywig.checkSession(function (error, sessionExists) {
      if (error) return done()

      done('Error should have been returned')
    })
  })

  it('should fail gracefully with invalid XML', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/broken.xml')

    blueBillywig.checkSession(function (error, sessionExists) {
      if (error) return done()

      done('Error should have been returned')
    })
  })
})

describe('logOff()', function () {
  it('should not fail if session is detroyed', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/log-off/success.xml')

    blueBillywig.logOff(function (error) {
      done(error)
    })
  })

  it('should fail if session is already destroyed', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/log-off/already-destroyed.xml')

    blueBillywig.logOff(function (error) {
      if (error) return done()

      done('Error should have been returned')
    })
  })

  it('should fail gracefully with invalid XML', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/xml/broken.xml')

    blueBillywig.logOff(function (error) {
      if (error) return done()

      done('Error should have been returned')
    })
  })
})

describe('search()', function () {
  it('should return 1 item correctly', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/json/search/one.json')

    blueBillywig.search('test', function (error, results) {
      if (error) return done(error)

      results.length.should.equal(1)
      done()
    })
  })

  it('should return no items correctly', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/json/search/none.json')

    blueBillywig.search('test', function (error, results) {
      if (error) return done(error)

      results.length.should.equal(0)
      done()
    })
  })

  it('should fail gracefully with invalid JSON', function (done) {
    var blueBillywig = new BlueBillywig(options)

    app.set('content', '/json/broken.json')

    blueBillywig.search('test', function (error) {
      if (error) return done()

      done('Error should have been returned')
    })
  })
})

describe('getImageUrl()', function () {
  it('should return constructed image URL', function (done) {
    var blueBillywig = new BlueBillywig(options)
      , imageUrl = blueBillywig.getImageUrl(500, 500, '/test-image.jpeg')
      , expectedImageUrl = 'http://localhost:3001/image/500/500/test-image.jpeg'

    imageUrl.should.equal(expectedImageUrl)
    done()
  })
})

describe('getJsPlayer()', function () {
  it('should return constructed JS player URL', function (done) {
    var blueBillywig = new BlueBillywig(options)
      , jsPlayerUrl = blueBillywig.getJsPlayer(120, 'main')
      , expectedJsPlayerUrl = 'http://localhost:3001/p/main/c/120.js'

    jsPlayerUrl.should.equal(expectedJsPlayerUrl)
    done()
  })
  it('should use default playout if no playout ID is supplied', function (done) {
    var blueBillywig = new BlueBillywig(options)
      , jsPlayerUrl = blueBillywig.getJsPlayer(130)
      , expectedJsPlayerUrl = 'http://localhost:3001/p/default/c/130.js'

    jsPlayerUrl.should.equal(expectedJsPlayerUrl)
    done()
  })
})