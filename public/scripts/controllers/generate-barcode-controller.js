//fix issue with NaN on cable number input
//fix try to speed up cable printing
// limit number of lables you can make at once
// combine cable entries into one

barcodeApp.controller('GenerateBarcodeController', ['$scope', '$window', function ($scope, $window) {

    //
    // Controller model
    //

    var model = {
      accessoryOptions      : ['A-Mount', 'A-Other', 'A-Gear', 'A-LR2'],
      showQuantityOptionList: ['Cable', 'A-Mount', 'A-Other', 'A-Gear', 'A-LR2']
    };

    //
    // View Model
    //

    $scope.model = {
      unitSelect: null,
      serialNum : null,
      numItems  : null,
      barcodes  : [],
      products  : [
        'FI',
        'HU3',
        'MDR3',
        'MDR4',
        'LR2 Sensor',
        'LR2 VIU',
        'LR2W',
        'LR2M',
        'HU4',
        'DMF3',
        'RMF',
        'VF3',
        'DM1X',
        'DM2X',
        'DM5',
        'BM',
        'Cable',
        'A-Gear',
        'A-Mount',
        'A-LR2',
        'A-Other'
      ]
    };

    /**
     * Add barcode to array and localStorage
     * @param {string} item
     * @param {string} serial
     * @param {number} numItem
     * @return {undefined}
     */
    $scope.addBarcode = function(item, serial, numItem){
      var reset = '';

      if (!item) {
        alert('Please select a unit type.');
      } else if (!serial) {
        alert('Please enter a serial number');
      } else {
        //make sure inputted serial number is the right number of characters
        if (validateSerialNumber(item, serial)) {
          //check to fix long barcodes due to sensor and VIU
          if (item === 'LR2 Sensor' || item === 'LR2 VIU') {
            item = 'LR2';
          }

          if (item === 'Cable' || model.accessoryOptions.indexOf(item) !== -1) {
            if (!isNaN(parseInt(numItem))) {
              for (var i=0; i<numItem; i++) {
                $scope.model.barcodes.push({unit: item, num: serial})
                localStorage.setItem('barcodes', JSON.stringify($scope.model.barcodes));
              }
              $scope.model = {
                unitSelect: null,
                serialNum : null,
                numItems  : null
              }
            } else {
              alert('Please enter a real number for how many ' + item + ' you wish to print barcodes for.');
              return;
            }
          } else {
            $scope.model.barcodes.push({unit: item, num: serial})
            localStorage.setItem('barcodes', JSON.stringify($scope.model.barcodes));

            for (var i=0; i<$scope.model.serialNum.length; i++) {
              if ($scope.model.unitSelect === "DMF3" && (i===1)) {
                reset += $scope.model.serialNum[i];
              } else if ($scope.model.unitSelect === "DM2X" && (i===0)) {
                reset += $scope.model.serialNum[i];
              } else if (isNaN($scope.model.serialNum[i])) {
                reset += $scope.model.serialNum[i];
              }
            }
          }

          //reset input to previous barcode lettering
          $scope.model.serialNum = reset;
        }
      }
    }

    /**
     * Validation that serial number is correct
     * @param {string} item
     * @param {number} serial
     * @return {bool}
     */
    var validateSerialNumber = function(item, serial){
      var shortBarcode     = ['FI', 'HU3', 'MDR3', 'MDR4', 'RMF', 'DM1X', 'DM5', 'BM', 'HU4', 'LR2W', 'LR2M'];
      var accessoryOptions = ['A-Mount', 'A-Other', 'A-Gear', 'A-LR2'];

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
      else if (item==='LR2 Sensor') {
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
      else if (item==='LR2 VIU') {
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
      else if (item==='DMF3') {
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
      else if (item==='VF3') {
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
      else if (item==='DM2X') {
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
      else if (item === 'Cable' || accessoryOptions.indexOf(item) !== -1) {
        return true;
      }
    }

    /**
     * Remove item from array and localStorage
     * @param {string} item
     * @return {undefined}
     */
    $scope.removeItem = function(item){
      $scope.model.barcodes.splice($scope.model.barcodes.indexOf(item), 1);
      localStorage.setItem('barcodes', JSON.stringify($scope.model.barcodes));
    }

    /**
     * Watcher for when unit is selected to update serial number
     * @return {undefined}
     */
    $scope.$watch('model.unitSelect', function(newValue) {
      if ($scope.model.unitSelect==='DMF3') {
        $scope.model.serialNum = 'D3-';
      }
      else if ($scope.model.unitSelect==='LR2 Sensor') {
        $scope.model.serialNum = 'LR';
      }
      else if ($scope.model.unitSelect==='LR2 VIU') {
        $scope.model.serialNum = 'VOU';
      }
      else if ($scope.model.unitSelect==='VF3') {
        $scope.model.serialNum = 'MF';
      }
      else if ($scope.model.unitSelect==='DM2X') {
        $scope.model.serialNum = '2X';
      }
      else if ($scope.model.unitSelect==='Cable') {
        $scope.model.serialNum = 'C';
      }
      else if ($scope.model.unitSelect==='A-LR2') {
        $scope.model.serialNum = 'L';
      }
      else if ($scope.model.unitSelect==='A-Mount') {
        $scope.model.serialNum = 'M';
      }
      else if ($scope.model.unitSelect==='A-Gear') {
        $scope.model.serialNum = 'G';
      }
      else if ($scope.model.unitSelect==='A-Other') {
        $scope.model.serialNum = 'A';
      }
      else {
        $scope.model.serialNum = '';
      }

      setFocus();
    })

    /**
     * Sets focus on next box after unit is selected
     * @return {undefined}
     */
    function setFocus() {
      var input = $window.document.getElementById('serialEntry');
      input.focus();
    }

    /**
     * Removes all barcodes from list
     * @public
     * @return {undefined}
     */
    $scope.removeAll = function() {
      $scope.model.barcodes = [];
      localStorage.setItem('barcodes', '');
    }

    /**
     * Shows/hides the number input for how many cables a user can see
     * @param {string} unit
     * @return {bool}
     */
    $scope.showHowMany = function(unitSelected) {
      return model.showQuantityOptionList.indexOf(unitSelected) !== -1;
    }
}])

.controller('PrintController', ['$scope', function ($scope) {
  $scope.allBarcodes   = JSON.parse(localStorage.getItem('barcodes'));
  var accessoryOptions = ['A-Mount', 'A-Other', 'A-Gear', 'A-LR2'];

  setTimeout(function(){
    for (var i in $scope.allBarcodes) {
      var id =  "#" + $scope.allBarcodes[i].unit + $scope.allBarcodes[i].num;

      if ($scope.allBarcodes[i].unit === 'Cable' || accessoryOptions.indexOf($scope.allBarcodes[i].unit) !== -1) {
        var text = $scope.allBarcodes[i].num;
      }
      else {
        var text = $scope.allBarcodes[i].unit + " s/n " + $scope.allBarcodes[i].num;
      }
      JsBarcode(id, text);
    }
  }, 0)

}])
