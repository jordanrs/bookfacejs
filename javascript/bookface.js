if(!com) var com = {};
if(!com.betapond) com.betapond = {};

com.betapond.bookface = function(options){
	this.login = {};
	this.perms_needed = options.perms || [];
	this.perms_given = [];
	this.callbacks = {
		perms_given: function(perms){},
		perms_not_given: function(perms){}
	};
};

com.betapond.bookface.prototype = {
	
	init: function(callback){
		var _t = this;
		FB.getLoginStatus(function(response){
			//console.debug('getLoginStatus', response);
			_t.auth = response.authResponse;
			_t.map_oauth2_session_to_legacy_session(response);
			callback(_t);
		},false);
	},
	
	access_token: function(){
	  return this.auth.accessToken;
	},
	
	uid: function(){
	  return this.auth.userID;
	},
	
	connect: function(onsuccess, onfailure){
		var _t = this;
		FB.login(function(response) {
			_t.after_connect(response, {onsuccess: onsuccess, onfailure: onfailure});
		}, {scope:this.perms_needed.join(',')});
	
	},
	
	after_connect: function(response, callbacks){
		if(response.authResponse != undefined){
			var _t = this;
			this.auth = response.authResponse;
			this.map_oauth2_session_to_legacy_session(response);
			if(this.perms_needed.length > 0){
			  this.verify_permissions(
					function(perms_given){
						callbacks.onsuccess(_t, perms_given);
					},
					function(perms_not_given){
						if(callbacks.onfailure !== undefined) callbacks.onfailure(_t, _t.perms_given, perms_not_given);
					}
				);
		  }
		  else{
				callbacks.onsuccess(_t, this.perms_given);
			}
		}
		else{
			if(callbacks.onfailure) callbacks.onfailure(_t, _t.perms_given);
		}
	},
	
	map_oauth2_session_to_legacy_session: function(response){
	  if(response.authResponse == undefined) return;
	  this.login = {
	    session:{
	      uid: response.authResponse.userID,
	      access_token: response.authResponse.accessToken,
	      expires: response.authResponse.expiresIn
	    }
	  }
	},

	connected: function(verify_permissions){
	  // force validate_permissions to be boolean
	  verify_permissions = !!verify_permissions; 
		if(this.auth == undefined){
			return false;
		}
		else{
			var status = true;
			if(verify_permissions){
			  for(var i in this.perms_needed){
  				if(this._indexOf(this.perms_given, this.perms_needed[i]) == -1){
  					status = false;
  					break;
  				}
  			}
  		}
			return status;
		}
	},
	
	while_connected: function(callback, options){
		if(options !== undefined){
			if(options.include_permissions !== undefined){
				for(var i in options.include_permissions){
					if(this._indexOf(this.perms_needed, options.include_permissions[i]) == -1){
						this.perms_needed.push(options.include_permissions[i]);
					}
				}
			}
			
			if(options.with_permissions !== undefined) this.perms_needed = options.with_permissions;
		}
		if(!this.connected()){
			this.connect(function(){ callback(); });
		}
		else{
			callback();
		}
	},

	verify_permissions: function(onsuccess, onfailure){
		var _t = this;
		FB.api('/me/permissions', function(response){
		  _t.perms_given = [];
		  for(var perm in response.data[0]) _t.perms_given.push(perm);
			if (_t.connected()){
				if(onsuccess != undefined) onsuccess();
				if(_t.callbacks.perms_given) _t.callbacks.perms_given(_t.perms_given, _t.perms_needed);
			}
			else{
				if(onfailure != undefined) onfailure();
				if(_t.callbacks.perms_given) _t.callbacks.perms_given(_t.perms_given, _t.perms_needed);
			}
		});
	},
	
	page_liked: function(page_id, on_liked, on_not_liked)
	{
		var _t = this;
		FB.api('/me/likes/' + page_id,
			function(response){
				if(response.data.length > 0 && response.data[0].id == page_id){
					on_liked();
				}
				else{
					if(on_not_liked !== undefined){
						on_not_liked();
						FB.Event.subscribe('edge.create', function(response) {
							if(('http://www.facebook.com/profile.php?id=' + page_id) === response){
								FB.Event.unsubscribe('edge.create', function(res){});
								on_liked();
							}
						});
					}
				}
			}
		);
	},
	
	// Stoopid IE!
	_indexOf: function(array, obj){
		for(var i=0; i<array.length; i++){
	   if(array[i]==obj){
	    return i;
	   }
	  }
	  return -1;
	}
	
};