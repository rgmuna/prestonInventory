
barcodeApp.service('authService', ['$http', '$rootScope', '$firebaseAuth', '$window', function ($http, $rootScope, $firebaseAuth, $window) {
  //initialize firebase auth
  var fbAuthService = $firebaseAuth();

  //login function opens pop up ----------------------
  this.loginWithGoogle = function(){
    //open popup and login w/ google
    return(fbAuthService.$signInWithPopup("google").then(function(authData) {
      //update localStorage
      $window.localStorage.authenticated = true;
      return true;
      }).catch(function(error) {
        alert(error);
      })
    )
  };

  //logs user out ------------------------
  this.logOut = function(){
    firebase.auth().signOut().then(function() {
      $window.localStorage.authenticated = false;
      $rootScope.$apply()
      return false;
    }, function(error) {
      console.error("logout failed:", error);
    });
  }

  return true;

}])
