barcodeApp.controller('AppController', ['$rootScope', 'authService', function($rootScope, authService) {

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

  renderPage();
}]);