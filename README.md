# Blue Billywig

This is a node module for interfacing with the [Blue Billywig API](http://support.bluebillywig.com/vms-api-guide). At present it is fairly limited in functionality, providing only the following:

* Authentication (including getting random token, and checking the session)
* Search (Passes through an object which is used to construct the query string, so any options provided by Blue Billywig are valid)
