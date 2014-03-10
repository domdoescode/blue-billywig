var blueBillywig = require('../api')()

// Get token for authentication
blueBillywig.getRandom(function (error, token) {
  if (error) throw error

  // Authenticate the user
  blueBillywig.authenticate('username', 'passw0rd', token, function (error, user) {
    if (error) throw error

    // Check that the user is logged in
    blueBillywig.checkSession(function (error, sessionExists) {
      if (error) throw error

      // User is logged in
      if (sessionExists) {
        console.log('yay')

        // Search for published videos
        blueBillywig.search('bord', function (error, results) {

          // Get the image, title and player JS url and output to console
          results.forEach(function (result) {
            var imageUrl = blueBillywig.getImageUrl(500, 300, result.mainthumbnail_string)
            console.log(imageUrl)
            console.log(result.title)
            console.log(blueBillywig.getJsPlayer(result.id))

            console.log()

            // Log the user out
            blueBillywig.logOff(function (error) {
              if (error) throw error

              // Ensure the session has been destroyed
              blueBillywig.checkSession(function (error, sessionExists) {
                if (sessionExists) {
                  console.log('sad face')
                } else {
                  console.log('yay')
                }
              })
            })
          })
        })
      } else {
        console.log('sad face')
      }
    })
  })
})