// A convenience class that manages the permissions workflow for the FB JSSDK
// along with some other common things that we do with the Graph API.
//
//  - **Authors** John Butler, John Stacey, Chris Gallagher
//  - **GitHub** http://github.com/betapond/bookfacejs
//  - **Copyright** Betapond Ltd. All Rights Reserved

window.Bookface = (function(){

  // private vars
  var auth = null,
  defaults = {scope: []},
  permissions = { state: 'not_loaded', needed: [], given: [], missing: [] },
  self;
  
  //private methods
  function indexOf(array, obj){
    for(var i=0; i<array.length; i++){
     if(array[i]==obj) return i;
    }
    return -1;
  }

  function extend() {
    var obj = arguments[0];
    for(var i = 1; i < arguments.length; i++){
      var source = arguments[i];
      for (var prop in source) obj[prop] = source[prop];
    }
    return obj;
  }

  function apply_callback(callback, args){
    if(callback && typeof callback == 'function'){
      callback.apply(self, args || []);
    }
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
      self = this;
      permissions.needed = options.scope || [];
      FB.getLoginStatus(function(response){
        auth = response.authResponse;
        if(auth) self.load_permissions();
        apply_callback(callback);
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

      // update permissions needed
      permissions.needed = permissions.needed.concat(options.scope || []);
      delete options.scope;
      
      var config = extend({}, options);

      // only trigger the login dialog if it is necessary
      if(!this.connected()){
        FB.login(function(response) {
          _t.after_connect(response, {onsuccess: onsuccess, onfailure: onfailure});
        }, {scope: permissions.needed.join(",")});
      }
      else{
        // fire success callback right away if we are already connected
        apply_callback(onsuccess);
      }
    },
    
    // never call this directly
    // it just stands in as the FB.login callback and enacts the permissions verification workflow
    after_connect: function(response, callbacks){
      if(response.authResponse !== undefined){
        auth = response.authResponse;
        if(permissions.needed.length > 0){
          this.verify_permissions(callbacks.onsuccess, callbacks.onfailure);
        }
        else{
          apply_callback(callbacks.onsuccess);
        }
      }
      else{
        apply_callback(callbacks.onfailure, [{type: 'login_error', response: response}]);
      }
    },

    // Checks to see if the user is currently connected/authenticated
    // leave this one to Bookface to use internally
    // **returns** `true` or `false`
    connected: function(){
      if(auth === undefined){
        return false;
      }
      else{
        var status = true;
        permissions.missing = [];
        for(var i = 0; i < permissions.needed.length; i++){
          if(indexOf(permissions.given, permissions.needed[i]) == -1){
            permissions.missing.push(permissions.needed[i]);
          }
        }
        return permissions.missing.length === 0;
      }
    },

    // **DEPRECATED:** May trigger a Facebook oAuth Login Dialog depending
    //
    // The logic for Bookface.connect() and Bookface.while_connected() has been merged
    //
    //
    while_connected: function(onsuccess, onfailure, options){
      console.log('Bookface.while_connected() is now deprecated and will be removed in the future. Please use Bookface.connect() instead.');
      this.connect(onsuccess, onfailure, options);
    },
    
    // don't use this directly
    load_permissions: function(onsuccess, onfailure){
      FB.api('/me/permissions', function(response){
        permissions.given = [];
        if(response.error){
          permissions.state = 'load_error';
          apply_callback(onfailure, [{type: 'permissions_load_error', response: response}]);
        }
        else{
          for(var perm in response.data[0]) permissions.given.push(perm);
          permissions.state = 'loaded';
          apply_callback(onsuccess);
        }
      });
    },

    // checks permissions after connecting
    verify_permissions: function(onsuccess, onfailure){
      this.load_permissions(function(){
        if (this.connected()){
          apply_callback(onsuccess);
        }
        else{
          apply_callback(onfailure, [{type: 'incomplete_permissions_error', permissions: permissions}]);
        }
      }, onfailure);
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
      FB.api('/me/likes/' + page_id,
        function(response){
          if(response.data.length > 0 && response.data[0].id == page_id){
            apply_callback(likes, [page_id]);
          }
          else{
            if(typeof no_likey == 'function'){
              apply_callback(no_likey, [page_id]);
              FB.Event.subscribe('edge.create', function(response) {
                if(('http://www.facebook.com/profile.php?id=' + page_id) === response){
                  FB.Event.unsubscribe('edge.create', function(res){});
                  apply_callback(likes, [page_id]);
                }
              });
            }
          }
        }
      );
    }
  }; // end of public methods
    
})();