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
  
  // public methods
  return {
    init: function(callback, options){
      var _t = this;
      extend(base_config, options);
      permissions.needed = base_config.scope || [];
      FB.getLoginStatus(function(response){
  			auth = response.authResponse;
  			callback && callback.apply(_t);
  		},false);
    },
    
  	login_status: function(){
  	  return auth;
  	},

  	access_token: function(){
  	  return auth.accessToken;
  	},

  	uid: function(){
  	  return auth.userID;
  	},
  	
  	permissions: permissions,

  	connect: function(onsuccess, onfailure, options){
  		var _t = this;
  		if(typeof onfailure == "object") options = onfailure; //allow connect(onsuccess, options)

  		var defaults = {scope: base_config.scope};
  		var config = extend({}, defaults, options);
  		FB.login(function(response) {
  			_t.after_connect(response, {onsuccess: onsuccess, onfailure: onfailure});
  		}, {scope: config.scope.join(",")});
  	},

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

  	while_connected: function(onsuccess, onfailure, options){
  		this.connected() ? onsuccess.apply(this) : this.connect(onsuccess, onfailure, options);
  	},

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