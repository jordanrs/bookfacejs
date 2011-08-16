/*

	Usage:

		var FB_APP_ID = 1234567890;
		var fbapp = null;

		window.fbAsyncInit = function() {
  
		 FB.init({
		    appId  : FB_APP_ID,
		    status : true, // check login status
		    cookie : true, // enable cookies to allow the server to access the session
		    xfbml  : true  // parse XFBML
				channelUrl: (window.location.protocol + "//" + HOSTNAME + "/fbchannel.html")
		  });

			// init app once fb sdk is loaded
			fbapp = new com.betapond.fbapp({perms: ['email','offline_access']});
			fbapp.init(function(){ init_app(); });
	
		  FB.Canvas.setAutoResize();
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
			fbapp.while_connected(function(){
				//do stuff in here that you want to ensure you have permission to do
			});
		}

*/

if(!com) var com = {};
if(!com.betapond) com.betapond = {};

com.betapond.fbapp = function(options){
	this.login = {};
	this.perms_needed = options.perms || [];
	this.callbacks = {
		perms_given: function(perms){},
		perms_not_given: function(perms){}
	};
};

com.betapond.fbapp.prototype = {
	
	init: function(callback){
		var _t = this;
		FB.getLoginStatus(function(response){
			console.debug('getLoginStatus', response);
			_t.login = response;
			_t.connected(); //take this out!
			callback(_t);
		},false);
	},
	
	connect: function(onsuccess, onfailure){
		var _t = this;
		FB.login(function(response) {
			_t.after_connect(response, {onsuccess: onsuccess, onfailure: onfailure});
		}, {perms:this.perms_needed.join(',')});
	
	},
	
	after_connect: function(response, callbacks){
		if(response.session != undefined){
			var _t = this;
			if(this.perms_needed.length > 0){
			  this.verify_permissions(function(perms_given){callbacks.onsuccess(_t, perms_given);}, function(perms_not_given){callbacks.onfailure(_t, _t.perms_given, perms_not_given);});
		  }
		  else{
				callbacks.onsuccess(_t, this.perms_given);
			}
		}
		else{
			if(callbacks.onfailure) callbacks.onfailure(_t, _t.perms_given);
		}
	},

	connected: function(){
		if(this.login.session == undefined){
			return false;
		}
		else{
			var status = true;
			var perms_given = this.perms_given();
			for(var i in this.perms_needed){
				if(perms_given.indexOf(this.perms_needed[i]) == -1){
					status = false;
					break;
				}
			}
			return status;
		}
	},
	
	while_connected: function(callback){
		if(!this.connected()){
			this.connect(function(){ callback(); });
		}
		else{
			callback();
		}
	},

	verify_permissions: function(onsuccess, onfailure){
		var _t = this;
		FB.getLoginStatus(function(response){
			_t.login = response;
			if (_t.connected()){
				if(onsuccess != undefined) onsuccess();
				if(_t.callbacks.perms_given) _t.callbacks.perms_given(_t.perms_given(), _t.perms_needed);
			}
			else{
				if(onfailure != undefined) onfailure();
				if(_t.callbacks.perms_given) _t.callbacks.perms_given(_t.perms_given(), _t.perms_needed);
			}
		},true);
	},

	perms_given: function(){
		var perms_given = [];
		var perms = this._get_perms();
		for(var key in perms){
			for(var i in perms[key]){
				perms_given.push(perms[key][i]);
			}
		}
		console.debug('perms_given', perms_given, 'perms_needed', this.perms_needed);
		return perms_given;
	},
	
 	_get_perms: function(){
		return eval( '(' + this.login.perms + ')' );
	}
	
};