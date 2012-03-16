var Tests = {
  init: function(){

    function success(){
      alert('Success!');
    }
    
    function failed(error){
      error && console.debug('error', error);
      alert('failed');
    }
    
    $('#connect').bind('click', function(){
      Bookface.while_connected(success, failed, {scope:Settings.permissions});
    });
    
  }
};