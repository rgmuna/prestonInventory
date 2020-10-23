barcodeApp.directive('ngEnter', function () {
  return function ($scope, element, attrs) {
    element.bind("keydown keypress", function (event) {
      if(event.which === 13) {
        $scope.$apply(function (){
          $scope.$eval(attrs.ngEnter);

          //script for resetting serial number while still including letters
          var reset = '';
          for(var i=0; i<$scope.model.serialNum.length; i++){
            if ($scope.model.unitSelect === "DMF3" && (i===1)) {
              reset += $scope.model.serialNum[i];
            } else if ($scope.model.unitSelect === "DM2X" && (i===0)) {
              reset += $scope.model.serialNum[i];
            } else if (isNaN($scope.model.serialNum[i])) {
              reset += $scope.model.serialNum[i];
            }
          };
          $scope.model.serialNum = reset;
        });
        event.preventDefault();
      }
    });
  };
})
