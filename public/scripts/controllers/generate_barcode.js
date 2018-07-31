//fix issue with NaN on cable number input
//fix try to speed up cable printing
// limit number of lables you can make at once
// combine cable entries into one

barcodeApp.controller('Generate_Barcode_Ctrl', [
  '$scope',
  '$window',
  function ($scope, $window) {

    $scope.chosenItems = {
      unitSelect: null,
      serialNum: null,
      numItems: null
    }

    //barcode array
    $scope.barcodes = [];

    //product options
    $scope.products = [
      'FI',
      'HU3',
      'MDR3',
      'MDR4',
      'LR2 Sensor',
      'LR2 VIU',
      'DMF3',
      'RMF',
      'VF3',
      'DM1X',
      'DM2X',
      'DM5',
      'BM',
      'Cable'
    ];

    //add barcode to array and update local storage-------
    $scope.addBarcode = function(item, serial, numItem){
      if(!item){
        alert('Please select a unit type.');
      }
      else if(!serial){
        alert('Please enter a serial number');
      }
      else{
        //make sure inputted serial number is the right number of characters
        if($scope.checkSerialNum(item, serial)){
          //check to fix long barcodes due to sensor and VIU
          if(item === 'LR2 Sensor' || item === 'LR2 VIU'){
            item = 'LR2';
          }

          if (item === 'Cable' || item === 'Accessory') {
            if (!isNaN(parseInt(numItem))) {
              for (var i=0; i<numItem; i++) {
                $scope.barcodes.push({unit: item, num: serial})
                localStorage.setItem('barcodes', JSON.stringify($scope.barcodes));
              }
              $scope.chosenItems = {
                unitSelect: null,
                serialNum: null,
                numItems: null
              }
            }
            else {
              alert('Please enter a real number for how many ' + item + ' you wish to print barcodes for.');
              return;
            }
          }
          else {
            $scope.barcodes.push({unit: item, num: serial})
            localStorage.setItem('barcodes', JSON.stringify($scope.barcodes));
          }

          //reset input to previous barcode lettering
          var reset = '';
          for(var i=0; i<$scope.chosenItems.serialNum.length; i++){
            if($scope.chosenItems.unitSelect === "DMF3" && (i===1)){
              reset += $scope.chosenItems.serialNum[i];
            }
            if($scope.chosenItems.unitSelect === "DM2X" && (i===0)){
              reset += $scope.chosenItems.serialNum[i];
            }
            if(isNaN($scope.chosenItems.serialNum[i])){
              reset += $scope.chosenItems.serialNum[i];
            }
          }
          $scope.chosenItems.serialNum = reset;
        }
      }
    }

    //checks that inputted serial number is correctly formatted -------
    $scope.checkSerialNum = function(item, serial){
      var shortBarcode = ['FI', 'HU3', 'MDR3', 'MDR4', 'RMF', 'DM1X', 'DM5', 'BM'];
      //if the item is one of the short barcode items
      if(shortBarcode.indexOf(item) >= 0){
        if(!isNaN(serial) && (serial.length === 4) && (item != 'DM5')){
          return true;
        }
        else if(!isNaN(serial) && (serial.length === 5) && (item==='DM5')){
          return true;
        }
        else{
          alert('Please use the correct type and number of characters (four numbers)')
          return false;
        }
      }
      //if item is LR2 sensor
      else if(item==='LR2 Sensor'){
        //convert inital 2 characters to letter substring
        var serialLetters = serial.substring(0, 2);
        //find length of characters after initial substring
        var numberLength = serial.substring(2).length;
        //convert remaining characters to numbers (returns false if not numbers)
        var serialNumbers = Number(serial.substring(2));

        var lettersCorrect = (serialLetters === 'LR');
        var numbersCorrect = (serialNumbers && numberLength===4);

        if(lettersCorrect && numbersCorrect){
          return true;
        }
        else{
          alert('Please use the correct type and number of characters')
          return false;
        }
      }
      else if(item==='LR2 VIU'){
        var serialLetters = serial.substring(0, 3);
        var numberLength = serial.substring(3).length;
        var serialNumbers = Number(serial.substring(3));

        var lettersCorrect = (serialLetters === 'VOU');
        var numbersCorrect = (serialNumbers && numberLength===4);

        if(lettersCorrect && numbersCorrect){
          return true;
        }
        else{
          alert('Please use the correct type and number of characters')
          return false;
        }
      }
      else if(item==='DMF3'){
        var serialLetters = serial.substring(0, 3);
        var numberLength = serial.substring(3).length;
        var serialNumbers = Number(serial.substring(3));

        var lettersCorrect = (serialLetters === 'D3-');
        var numbersCorrect = (serialNumbers && numberLength===4);

        if(lettersCorrect && numbersCorrect){
          return true;
        }
        else{
          alert('Please use the correct type and number of characters')
          return false;
        }
      }
      else if(item==='VF3'){
        var serialLetters = serial.substring(0, 2);
        var numberLength = serial.substring(2).length;
        var serialNumbers = Number(serial.substring(2));

        var lettersCorrect = (serialLetters === 'MF');
        var numbersCorrect = (serialNumbers && numberLength===5);

        if(lettersCorrect && numbersCorrect){
          return true;
        }
        else{
          alert('Please use the correct type and number of characters')
          return false;
        }
      }
      else if(item==='DM2X'){
        var serialLetters = serial.substring(0, 2);
        var numberLength = serial.substring(2).length;
        var serialNumbers = Number(serial.substring(2));

        var lettersCorrect = (serialLetters === '2X');
        var numbersCorrect = (serialNumbers && numberLength===4);

        if(lettersCorrect && numbersCorrect){
          return true;
        }
        else{
          alert('Please use the correct type and number of characters')
          return false;
        }
      }
      else if (item === 'Cable' || item === 'Accessory') {
        return true;
      }
    }

    //remove item from array and update local storage -------
    $scope.removeItem = function(item){
      $scope.barcodes.splice($scope.barcodes.indexOf(item), 1);
      localStorage.setItem('barcodes', JSON.stringify($scope.barcodes));
    }

    //checks when an item is selected and updates the appropriate serial num letters -------
    $scope.$watch('chosenItems.unitSelect', function(newValue) {
      if($scope.chosenItems.unitSelect==='DMF3'){
        $scope.chosenItems.serialNum = 'D3-';
      }
      else if($scope.chosenItems.unitSelect==='LR2 Sensor'){
        $scope.chosenItems.serialNum = 'LR';
      }
      else if($scope.chosenItems.unitSelect==='LR2 VIU'){
        $scope.chosenItems.serialNum = 'VOU';
      }
      else if($scope.chosenItems.unitSelect==='VF3'){
        $scope.chosenItems.serialNum = 'MF';
      }
      else if($scope.chosenItems.unitSelect==='DM2X'){
        $scope.chosenItems.serialNum = '2X';
      }
      else if($scope.chosenItems.unitSelect==='Cable'){
        $scope.chosenItems.serialNum = 'C';
      }
      else {
        $scope.chosenItems.serialNum = '';
      }

      $scope.setFocus();
    })

    $scope.setFocus = function(){
      var input = $window.document.getElementById('serialEntry');
      input.focus();
    }

    //removes all items preparing to be scanned ---------
    $scope.removeAll = function(){
      $scope.barcodes = [];
      localStorage.setItem('barcodes', '');
    }

    //when generate barcodes is clicked before anything is added ---------
    $scope.checkForItems = function(){
      if(!$scope.barcodes.length){
        localStorage.setItem('barcodes', '');
        alert("Probably should've entered some items");
      }
    }

}])

.controller('PrintController', ['$scope', function ($scope) {
  $scope.allBarcodes = JSON.parse(localStorage.getItem('barcodes'));

  setTimeout(function(){
    for (var i in $scope.allBarcodes) {
      var id =  "#" + $scope.allBarcodes[i].unit + $scope.allBarcodes[i].num;

      if ($scope.allBarcodes[i].unit === 'Cable' || $scope.allBarcodes[i].unit === 'Accessory') {
        var text = $scope.allBarcodes[i].num;
      }
      else {
        var text = $scope.allBarcodes[i].unit + " s/n " + $scope.allBarcodes[i].num;
      }
      JsBarcode(id, text);
    }
  }, 0)

}])
