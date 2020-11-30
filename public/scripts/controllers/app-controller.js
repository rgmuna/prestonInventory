barcodeApp.controller('AppController', ['$rootScope', 'authService', '$state', function($rootScope, authService, $state) {

  //
  // $rootScope model
  //

  $rootScope.loggedIn = {
    user : false,
    admin: false
  }

  /**
   * Initiates Page
   * @return {undefined}
   */
  function renderPage() {
    authService.setAuthState();
  }


  /**
   * Check if user is logged in on each state change
   * @return {undefined}
   */
  $rootScope.$on('$stateChangeSuccess', function() {
    if (!$rootScope.loggedIn.user && !$rootScope.loggedIn.admin) {
      $state.go('login');
    }
  });

  renderPage();
}]);