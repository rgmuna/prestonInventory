barcodeApp.controller('AuthController', ['$scope', '$rootScope', 'authService', function($scope, $rootScope, authService) {

  $scope.authenticated = authService.userLoggedIn;
  $scope.adminLoggedIn = authService.adminLoggedIn;

  //login function
  $scope.login = function(runAuth){
    $scope.authenticating = true;

    authService.login().then(function(result){
      $scope.authenticated = true;
      $scope.authenticating = false;
      $scope.adminLoggedIn = authService.adminLoggedIn;
      if (result.additionalUserInfo.profile.picture) {
        console.log(result.additionalUserInfo.picture );
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
