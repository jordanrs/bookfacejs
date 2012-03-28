#Bookface.js

A handy wrapper for the things we do all the time with the FB JSSDK. Mainly, the permissions workflow.

For full, annoted source docs, see `doc/bookface.html`

##Usage Example

```
	var Settings = {
	  app_id: '12345678910',
	  permissions: ["publish_actions","email"]
	};

	window.fbAsyncInit = function() {

	 FB.init({
	    appId  : Settings.app_id,
	    status : true, // check login status
	    cookie : true, // enable cookies to allow the server to access the session
	    xfbml  : true,  // parse XFBML
      channelUrl: (window.location.protocol + "//" + window.location.host + "/fbchannel.html")
	  });

		// init app once fb sdk is loaded
		Bookface.init( function(){ MyApp.init() });
	};
	
	$(document).ready(function(){
  	$('a#connect').bind('click', function(){
  	  Bookface.while_connected(function(){ alert(this.uid()) }, {scope:Settings.permissions});
  	});
  });
	

```