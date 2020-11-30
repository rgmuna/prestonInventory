barcodeApp.controller('HomeController', ['$scope', 'authService', '$rootScope', function($scope, authService, $rootScope) {
  $rootScope.onHomePage = true;

  /**
   * Login controller function
   * @return {undefined}
   */
  $scope.login = function() {
    authService.login();
  };
}])
