//returns true/false if unit scan is older than 30 days old
barcodeApp.filter('filterOldies', function() {
    return function(input) {
      var number = parseInt(input.timestamp, 10);
      var currDate = (new Date()).getTime();
      var thirtyDaysAgo = currDate - 2592000000;

      //is unit younger than 30 days?
      var youngEnough = number > thirtyDaysAgo;
      //is unit NOT checked out for purchase?
      var isNotPurchased = input.status !== "checked out - purchase";

      if(youngEnough || isNotPurchased){
        return true;
      }
      else{
        return false;
      }

    };
})
