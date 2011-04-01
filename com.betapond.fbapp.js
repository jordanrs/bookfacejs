/*

	Usage:

		const FB_APP_ID = 1234567890;
		var fbapp = null;

		window.fbAsyncInit = function() {
  
		 FB.init({
		    appId  : FB_APP_ID,
		    status : true, // check login status
		    cookie : true, // enable cookies to allow the server to access the session
		    xfbml  : true  // parse XFBML
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
	this.perms_given = [];
	this.perms_not_given = [];
	this.callbacks = {
		perms_given: function(perms){},
		perms_not_given: function(perms){}
	};
};

com.betapond.fbapp.prototype = {
	
	init: function(callback){
		var _fbapp = this;
		FB.getLoginStatus(function(response){
			_fbapp.login = response;
			callback(_fbapp);
		},true);
	},
	
	connect: function(onsuccess, onfailure){
		var _fbapp = this;
		FB.login(function(response) {
			_fbapp.login = response;
			_fbapp.after_connect(response, {onsuccess: onsuccess, onfailure: onfailure});
		}, {perms:this.perms_needed.join(',')});
	
		// modal ui doesn't bloody work. Thank's Facebook. Thacebook.
		//FB.ui({method:'auth.login',display:'iframe',scope:this.perms_needed}, function(response){_t.init(response)});
	},
	
	after_connect: function(response, callbacks){
		if(this.connected()){
			var _fbapp = this;
			if(this.perms_needed.length > 0){
			  this.verify_permissions(function(perms_given){callbacks.onsuccess(_fbapp, perms_given);}, function(perms_not_given){callbacks.onfailure(_fbapp, _fbapp.perms_given, perms_not_given);});
		  }
		  else{
				callbacks.onsuccess(_fbapp, this.perms_given);
			}
		}
		else{
			if(callbacks.onfailure)callbacks.onfailure(_fbapp, _fbapp.perms_given);
		}
	},

	connected: function(){
		return (this.login.session != undefined);
	},


	permitted: function(){
		return (this.perms_given.length == this.perms_needed.length);
	},
	
	while_connected: function(callback){
		if(!this.connected()){
			this.connect(function(){ callback(); });
		}
		else{
			callback();
		}
	},


	// calls on_given(this.perms_given) if all permissions are verified.
	// if any perms are missing, on_not_given(this.perms_not_given) is called
	verify_permissions: function(onsuccess, onfailure){
	  this.perms_given = [];
		this.perms_not_given = [];
		var _fbapp = this;
		var query = FB.Data.query('select uid, {0} from permissions where uid = {1}',this.perms_needed.join(','), this.login.session.uid);
		query.wait(function(rows){_fbapp._update_permissions(rows, onsuccess, onfailure);});
	},

	_update_permissions: function(rows, onsuccess, onfailure){
		if(rows.length == 0)
		{
			// not_given = this.perms_needed
			this.perms_not_given = this.perms_needed;
			if(on_not_given) on_not_given(this.perms_not_given);
		}
		else
		{
			var row = rows[0];
			for(var i in this.perms_needed)
			{
				var perm = this.perms_needed[i];
				if(row[perm] == "1")
				{
			    this.perms_given.push(perm);
				}
				else
				{
					this.perms_not_given.push(perm);
				}
			}
		}
		// callbacks
		if(this.perms_given.length == this.perms_needed.length){
			if(onsuccess) onsuccess(this.perms_given);
			if(this.callbacks.perms_given) this.callbacks.perms_given(this.perms_given);
		}
		if(this.perms_not_given.length > 0){
			if(onfailure) onfailure(this.perms_not_given);
			if(this.callbacks.perms_not_given) this.callbacks.perms_not_given(this.perms_not_given);
		}
	}
};