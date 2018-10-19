
barcodeApp.service('authService', ['$firebaseAuth', '$q', function ($firebaseAuth, $q) {
  //initialize firebase auth
  var fbAuthService = $firebaseAuth();

  var adminUsers = ['zVviAJYax8ZDBixjH4WmP2oSQTX2', '9qUP0HfpYlR1FdLueetfXGJR00z1', '4pmBPQrAqoeOh3J39TXU0CoRHtH3'];

  function checkAdmin(credentials) {
    if (adminUsers.indexOf(credentials.user.uid) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  var authService = {
    adminLoggedIn : false,
    userLoggedIn  : false,
    userName      : '',
    login         : function() {
      var deferred = $q.defer();

      fbAuthService.$signInWithPopup("google").then(function(result){
        authService.userLoggedIn  = true;
        authService.adminLoggedIn = checkAdmin(result);
        deferred.resolve(result);
      }, function(error) {
        alert('User not logged in.')
        deferred.reject(error);
      })

      return deferred.promise;
    },
    logOut        : function() {
      var deferred = $q.defer();

      fbAuthService.$signOut().then(function(result){
        deferred.resolve(result);
      }, function(error) {
        alert("User didn't log out. Try again.");
        deferred.reject(error);
      });

      return deferred.promise;
    }
  }

  return authService;
}])
