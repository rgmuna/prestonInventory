
barcodeApp.service('authService', ['$firebaseAuth', '$q', '$firebaseObject', '$rootScope', '$state', function ($firebaseAuth, $q, $firebaseObject, $rootScope, $state) {

  //
  // Service Model
  //

  var model = {
    adminUsers    : firebase.database().ref().child('adminUsers'),
    adminObject   : null,
    adminsLoaded  : false,
    loggedInLoaded: false,
    userInfo      : null
  }

  /**
   * Initiates service
   * @return {undefined}
   */
  function renderService() {
    model.adminObject = $firebaseObject(model.adminUsers);
  }

  /**
   * Gets list of admin users from database
   * @return {Promise}
   */
  function getListAdminUsers() {
    model.adminObject.$loaded().then(function(response) {
      model.adminsLoaded = true;
      setStatuses();
    })
  }

  /**
   * Checks if user is admin
   * @return {bool}
   */
  function userIsAdmin() {
    for (var key in model.adminObject) {
      if (model.adminObject.hasOwnProperty(key)) {
        if (model.userInfo.uid === model.adminObject[key]) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Sets statuses for user auth
   * @return {undefined}
   */
  function setStatuses() {
    if (!model.adminsLoaded) {
      return;
    }

    if (!model.loggedInLoaded) {
      return;
    }

    if (!model.userInfo) {
      $state.go('login');
      reset();
      return;
    }

    $rootScope.loggedIn.user  = true;
    $rootScope.loggedIn.admin = userIsAdmin();
    $rootScope.userEmail      = model.userInfo.email;
    $rootScope.onHomePage     = false;

    // After setting statuses, redirect to home
    $state.go('inventory-list');
  }

  /**
   * Reset logged in state
   * @return {undefined}
   */
  function reset() {
    $rootScope.loggedIn.admin = false
    $rootScope.loggedIn.user  = false
    model.userInfo            = null;
    model.adminsLoaded        = false;
    model.loggedInLoaded      = false;
  }

  renderService();

  var authService = {
    /**
     * Set auth status for logged in user
     * @return {undefined}
     */
    setAuthState: function() {
      reset();
      getListAdminUsers();

      $firebaseAuth().$onAuthStateChanged(function(user) {
        model.loggedInLoaded = true;
        model.userInfo       = user || null;

        setStatuses();
      });
    },
    /**
     * Login function
     * @return {Promise}
     */
    login : function() {
      var deferred = $q.defer();
      reset();

      $firebaseAuth().$signInWithPopup("google").then(function(result){
        deferred.resolve(result);
        authService.setAuthState();
      }, function(error) {
        alert('User not logged in.')
        deferred.reject(error);
      })

      return deferred.promise;
    },
    /**
     * Logout Function
     * @return {Promise}
     */
    logOut : function() {
      var deferred = $q.defer();
      reset();

      $firebaseAuth().$signOut().then(function(result){
        deferred.resolve(result);
        authService.setAuthState();
      }, function(error) {
        alert("User didn't log out. Try again.");
        deferred.reject(error);
      });

      return deferred.promise;
    }
  }

  return authService;
}])
