barcodeApp.controller('AuthController', ['$scope', '$rootScope', 'authService', function($scope, $rootScope, authService) {

  $rootScope.authenticated = authService.userLoggedIn;
  $rootScope.adminLoggedIn = authService.adminLoggedIn;

  //login function
  $scope.login = function(runAuth){
    $scope.authenticating = true;

    authService.login().then(function(result){
      $rootScope.authenticated = true;
      $scope.authenticating = false;
      $rootScope.adminLoggedIn = authService.adminLoggedIn;
      if (result.additionalUserInfo.profile.picture) {
        $scope.userPicture = result.additionalUserInfo.profile.picture;
      }
    }, function() {
      $scope.authenticated = false;
      $scope.authenticating = false;
    });
  };

  $scope.logout = function(){
    authService.logOut();
    $scope.authenticated = false;
  };

}])
