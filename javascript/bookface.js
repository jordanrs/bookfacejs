window.Bookface = (function(){

  // private vars
  var auth = null,
  defaults = {scope: []},
  base_config = {},
  permissions = { needed: [], given: [], missing: [] };  
  
  //private methods
  function indexOf(array, obj){
		for(var i=0; i<array.length; i++){
	   if(array[i]==obj) return i;
	  }
	  return -1;
	}

	function extend(obj, source) {
    for (var prop in source) obj[prop] = source[prop];
    return obj;
  }
  
  return {

    // **Public:** Initialises Bookface and checks the users login status
    //
    // - callback: (required) fired when getLoginStatus returns
    // - options: a hash of options
    // 
    //   **Examples**
    // 
    //   `Bookface.init(MyApp.init, {scope:['email','publish_actions']});`
    init: function(callback, options){
      var _t = this;
      extend(base_config, options);
      permissions.needed = base_config.scope || [];
      FB.getLoginStatus(function(response){
  			auth = response.authResponse;
  			callback && callback.apply(_t);
  		},false);
    },
    
    // **Public:** returns the Facebook `authResponse` fetched during `Bookface.init`
  	login_status: function(){
  	  return auth;
  	},
    
    // **Public:** returns the current user's Facebook access_token for this app.
  	access_token: function(){
  	  return auth.accessToken;
  	},
    
    // **Public:** returns the current user's Facebook user id.
  	uid: function(){
  	  return auth.userID;
  	},
  	
  	// **Public:** returns an object describing the permissions needed, given and missing for this app
  	permissions: permissions,

    // **Public:** Triggers a Facebook OAuth Login Dialog
    //
    // - onsuccess: (required) fired when permissions are succesfully obtained
    // - onfailure: (optional, recommended) fired when permissions are not succesfully obtained
    // - options: a hash of options
    //
    //   **Examples**
    // 
    //   `Bookface.connect(function(){alert('Yay!')}, function(){alert('Aw noes!')}, {scope:['email','publish_actions']});`
    //
    //   if you specified scope during `Bookface.init` then you don't need that here
    //   note that if you do pass a scope here, it will override whatever scope you defined during `Bookface.init` for the duration of this `connect`
    //
    //   `Bookface.connect(function(){alert('Yay!')}, function(){alert('Aw noes!')});`
  	connect: function(onsuccess, onfailure, options){
  		var _t = this;
  		if(typeof onfailure == "object") options = onfailure; //allow connect(onsuccess, options)

  		var defaults = {scope: base_config.scope};
  		var config = extend({}, defaults, options);
  		FB.login(function(response) {
  			_t.after_connect(response, {onsuccess: onsuccess, onfailure: onfailure});
  		}, {scope: config.scope.join(",")});
  	},
    
    // never call this directly
    // it just stands in as the FB.login callback and enacts the permissions verification workflow
  	after_connect: function(response, callbacks){
  		if(response.authResponse != undefined){
  			auth = response.authResponse;
  			if(permissions.needed.length > 0){
  			  this.verify_permissions(callbacks.onsuccess, callbacks.onfailure);
  		  }
  		  else{
  				callbacks.onsuccess && callbacks.onsuccess.apply(this);
  			}
  		}
  		else{
  			callbacks.onfailure && callbacks.onfailure.apply(this, [{type: 'login_error', response: response}]);
  		}
  	},

    // Checks to see if the user is currently connected/authenticated
    // leave this one to Bookface to use internally
    // **returns** `true` or `false`
  	connected: function(){
  		if(auth == undefined){
  			return false;
  		}
  		else{
  			var status = true;
  			permissions.missing = [];
  			for(var i in permissions.needed){
  				if(indexOf(permissions.given, permissions.needed[i]) == -1){
  					permissions.missing.push(permissions.needed[i]);
  				}
  			}
  			return (permissions.missing.length == 0);
  		}
  	},

    // **Public:** May trigger a Facebook oAuth Login Dialog depending
    //
    //  Just the same as `Bookface.connect` except that it will execute `onsuccess` immediately if `Bookface.connected()` returns `true`
    //
    // - onsuccess: (required) fired when permissions are succesfully obtained
    // - onfailure: (optional, recommended) fired when permissions are not succesfully obtained
    // - options: a hash of options
    //
    //   **Examples**
    // 
    //   `Bookface.while_connected(function(){alert('Yay!')}, function(){alert('Aw noes!')}, {scope:['email','publish_actions']});`
    //
    //   if you specified scope during `Bookface.init` then you don't need that here
    //   note that if you do pass a scope here, it will override whatever scope you defined during `Bookface.init` for the duration of this `connect`
    //
    //   `Bookface.connect(function(){alert('Yay!')}, function(){alert('Aw noes!')});`
  	while_connected: function(onsuccess, onfailure, options){
  		this.connected() ? onsuccess.apply(this) : this.connect(onsuccess, onfailure, options);
  	},

    // checks permissions after connecting
  	verify_permissions: function(onsuccess, onfailure){
  		var _t = this;
  		FB.api('/me/permissions', function(response){
  		  permissions.given = [];
  		  if(response.error){
  		    onfailure && onfailure.apply(_t, [{type: 'verify_permissions_error', response: response}]);
  		  }
  		  else{
    		  for(var perm in response.data[0]) permissions.given.push(perm);
    			if (_t.connected()){
    				onsuccess && onsuccess.apply(_t);
    			}
    			else{
    				onfailure && onfailure.apply(_t, [{type: 'incomplete_permissions_error', permissions: permissions}]);
    			}
    		}
  		});
  	},


    // **Public:** Checks to see if the current user likes a page
    //
    //  Note you need to have the user_likes permission for this one
    //  If you don't already like the page, the method subscribes to the edge.create event
    //  we currenly only get a callback for that event if you use the XFBML Like Button
    //
    // - page_id: (required) the id of the page you're checking
    // - likes: (required) a callback executed if the page is liked
    // - no_likey (required recommended): a callback executed if the page is not liked 
    //
    //   **Examples**
    // 
    //   `Bookface.page_liked('123456789102', function(){alert('Hey Mikey I think he likes it!');}, function(){ alert('Why you no like?'); } );`
  	page_liked: function(page_id, likes, no_likey){
  		var _t = this;
  		FB.api('/me/likes/' + page_id,
  			function(response){
  				if(response.data.length > 0 && response.data[0].id == page_id){
  					likes && likes.apply(_t, [page_id]);
  				}
  				else{
  					if(no_likey){
  						no_likey.apply(this, [page_id]);
  						FB.Event.subscribe('edge.create', function(response) {
  							if(('http://www.facebook.com/profile.php?id=' + page_id) === response){
  								FB.Event.unsubscribe('edge.create', function(res){});
  								likes && likes.apply(_t, [page_id]);
  							}
  						});
  					}
  				}
  			}
  		);
  	}
  }; // end of public methods
    
})();