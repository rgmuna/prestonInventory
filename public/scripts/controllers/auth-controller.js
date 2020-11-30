barcodeApp.controller('AuthController', ['$scope', 'authService', function($scope, authService) {

  //
  // View Model
  //

  $scope.model = {
    loadingAuth  : false
  }

  /**
   * Login controller function
   * @return {undefined}
   */
  $scope.login = function() {
    $scope.model.loadingAuth = true;

    authService.login().then(function() {
      $scope.model.loadingAuth = false;
    }, function() {
      $scope.model.loadingAuth = false;
    });
  };

  /**
   * Log user out
   * @return {undefinee}
   */
  $scope.logout = function() {
    authService.logOut();
  };
}])
