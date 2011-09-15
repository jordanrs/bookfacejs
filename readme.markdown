#Usage
```
	var FB_APP_ID = 1234567890;
	var Bookface = null;

	window.fbAsyncInit = function() {

	 FB.init({
	    appId  : FB_APP_ID,
	    status : true, // check login status
	    cookie : true, // enable cookies to allow the server to access the session
	    xfbml  : true,  // parse XFBML
      channelUrl: (window.location.protocol + "//" + HOSTNAME + "/fbchannel.html")
	  });

		// init app once fb sdk is loaded
		Bookface = new com.betapond.bookface({perms: ['email']});
		Bookface.init(function(){ init_app(); });

	  // FB.Canvas.setAutoResize();
	};

	$(document).ready(function(){ 
	  var e = document.createElement('script');
	  e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js?v=1';
	  e.async = true;
	  document.getElementById('fb-root').appendChild(e);
	});

	function init_app(){
	  // initialize your application code here knowing that FB JS SDK is initialized
	  // and also fbapp is initialised and has checked session status
		Bookface.while_connected(function(){
			//do stuff in here that you want to ensure you have permission to do
		}, {include_permissions: ["publish_stream"]});
	}
```
##Session Information

```
var user_id = Bookface.login.session.uid;
var access_token = Bookface.login.session.access_token;
```

##Check if a page is liked
Note: You will need user_likes permission for this.

```
var page_id = '147967461910802';
Bookface.page_liked(page_id, function(){alert('Page Liked')}, function(){alert('Page not liked');});
```