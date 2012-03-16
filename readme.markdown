#Usage

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

##Session Information

```
var auth_response = Bookface.login_status();
var user_id = Bookface.uid();
var access_token = Bookface.access_token();
```


##Check if a page is liked
Note: You will need user_likes permission for this.

```
var page_id = '147967461910802';
Bookface.page_liked(page_id, function(){alert('Page Liked')}, function(){alert('Page not liked');});
```