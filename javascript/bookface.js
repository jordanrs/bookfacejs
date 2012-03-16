if(!com) var com = {};
if(!com.betapond) com.betapond = {};

com.betapond.bookface = function(options){
	this.auth = null;
	var defaults = {scope: []};
	this.options = this._extend({}, defaults, options);
	this.perms_needed = options.scope;
	this.perms_given = [];
	this.perms_missing = [];
};

com.betapond.bookface.prototype = {

	init: function(callback){
		var _t = this;
		FB.getLoginStatus(function(response){
			_t.auth = response.authResponse;
			callback && callback.apply(_t);
		},false);
	},
	
	login_status: function(){
	  return this.auth;
	},
	
	access_token: function(){
	  return this.auth.accessToken;
	},
	
	uid: function(){
	  return this.auth.userID;
	},
	
	connect: function(onsuccess, onfailure, options){
		var _t = this;
		if(typeof onfailure == "object") options = onfailure; //allow connect(onsuccess, options)
		
		var defaults = {scope: this.perms_needed};
		var config = this._extend({}, defaults, options);
		//console.log("Bookface.connect", config.scope);
		FB.login(function(response) {
			_t.after_connect(response, {onsuccess: onsuccess, onfailure: onfailure});
		}, {scope: config.scope.join(",")});
	},
	
	after_connect: function(response, callbacks){
		if(response.authResponse != undefined){
			this.auth = response.authResponse;
			if(this.perms_needed.length > 0){
			  this.verify_permissions(callbacks.onsuccess, callbacks.onfailure)
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
		if(this.auth == undefined){
			return false;
		}
		else{
			var status = true;
			this.perms_missing = [];
			for(var i in this.perms_needed){
				if(this._indexOf(this.perms_given, this.perms_needed[i]) == -1){
					this.perms_missing.push(this.perms_needed[i]);
				}
			}
			return (this.perms_missing.length == 0);
		}
	},
	
	while_connected: function(onsuccess, onfailure, options){
		this.connected() ? onsuccess.apply(this) : this.connect(onsuccess, onfailure, options);
	},

	verify_permissions: function(onsuccess, onfailure){
		var _t = this;
		FB.api('/me/permissions', function(response){
		  _t.perms_given = [];
		  if(response.error){
		    onfailure && onfailure.apply(_t, [{type: 'verify_permissions_error', response: response}]);
		  }
		  else{
  		  for(var perm in response.data[0]) _t.perms_given.push(perm);
  			if (_t.connected()){
  				onsuccess && onsuccess.apply(_t);
  			}
  			else{
  				onfailure && onfailure.apply(_t, [{type: 'incomplete_permissions_error', perms_missing: _t.perms_missing}]);
  			}
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
	
	// support methods... mostly copied in from underscore.js
	_indexOf: function(array, obj){
		for(var i=0; i<array.length; i++){
	   if(array[i]==obj){
	    return i;
	   }
	  }
	  return -1;
	},
	
	_extend: function (obj, source) {
    for (var prop in source) {
      obj[prop] = source[prop];
    }
    return obj;
  }

};