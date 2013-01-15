var Tests = {
  init: function(){

    function success(){
      
      var bq = Bookface.batchQuery();
      bq.addQuery('GET', '/me');
      bq.addQuery('GET', '/3616968');
      bq.send(function(response){
        console.log(response);
      })
    }
    
    function failed(error){
      error && console.debug('error', error);
      alert('failed');
    }
    
    $('#connect').bind('click', function(){
      Bookface.connect(success, failed, {scope:Settings.permissions});
    });
    
  }
};

