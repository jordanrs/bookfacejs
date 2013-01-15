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
    // you can pass scope to init, this defines a default set of permissions
    Bookface.init( function(){ MyApp.init() }, {scope: Settings.permissions});
  };
    
  $(document).ready(function(){
    $('a#connect').on('click', function(){
      Bookface.connect(function(){ initalized });
    });

    $('a#upload_photo').on('click', function(){
      Bookface.connect(function(){ initalized }, {scope: ['user_photos']});
    });

		function initalized(){
			console.log(Bookface.permissions); 
			var bq = Bookface.batchQuery();
      bq.addQuery('GET', '/me');
      bq.addQuery('GET', '/3616968');
      bq.send(function(response){
        console.log(response);
      })
		};
  });
  
	// using fb batch batch quering

```