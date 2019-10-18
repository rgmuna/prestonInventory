barcodeApp.directive('ngEnter', function () {
  return function ($scope, element, attrs) {
    element.bind("keydown keypress", function (event) {
      if(event.which === 13) {
        $scope.$apply(function (){
          $scope.$eval(attrs.ngEnter);

          //script for resetting serial number while still including letters
          var reset = '';
          for(var i=0; i<$scope.chosenItems.serialNum.length; i++){
            if ($scope.chosenItems.unitSelect === "DMF3" && (i===1)) {
              reset += $scope.chosenItems.serialNum[i];
            } else if ($scope.chosenItems.unitSelect === "DM2X" && (i===0)) {
              reset += $scope.chosenItems.serialNum[i];
            } else if (isNaN($scope.chosenItems.serialNum[i])) {
              reset += $scope.chosenItems.serialNum[i];
            }
          };
          $scope.chosenItems.serialNum = reset;
        });
        event.preventDefault();
      }
    });
  };
})
