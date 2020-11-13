barcodeApp.controller('LoanerScannerController', ['$scope','$rootScope','$firebaseArray','$firebaseObject','$timeout','$http','$window', function ($scope, $rootScope, $firebaseArray, $firebaseObject, $timeout, $http, $window) {

  //
  // Controller Model
  //

  var model = {
    loanerReference: null,
    loanerObject   : null,
    loanerArray    : null
  };

  //
  // View Model
  //

  $scope.model = {
    loaded        : false,
    barcodeScanned: '',
    pendingLoaners: {},
    customerList  : [],
    loanerProducts: [
      'FI',
      'HU3',
      'MDR2',
      'MDR3',
      'MDR4',
      'LR2',
      'VIU',
      'DMF3',
      'DMF2',
      'RMF',
      'VF3',
      'DM1X',
      'DM2X',
      'DM5',
      'DM4X',
      'DM2',
      'VLC',
      'BM',
      'LR2W',
      'LR2M',
      'HU4'
    ]
  };

  /**
   * Initializes page
   * @return {undefined}
   */
  function renderPage() {
    model.loanerReference = firebase.database().ref().child('loaners');;
    model.loanerObject    = $firebaseObject(model.loanerReference);
    model.loanerArray     = $firebaseArray(model.loanerReference);

    model.loanerArray.$loaded().then(function() {
      $scope.model.loaded = true;
      createListOfCustomers();
    });
  }

  renderPage();

  /**
   * Creates list of customers after loaners are loaded
   * @return {undefined}
   */
  function createListOfCustomers() {
    //for each item in loaner array
    for (var i = 0; i < model.loanerArray.length; i++) {
      var singleLoaner = model.loanerArray[i];

      //find units that are checked out
      if (singleLoaner.status === 'checked out') {
        //if object is NOT already in customer array
        if (!customerInCustomerList(singleLoaner.customerInfo, $scope.model.customerList)) {
          //add customer to customer array
          $scope.model.customerList.push(singleLoaner.customerInfo);
        }
      }
    }
  };

  /**
   * Checks if input customerInfo has a name that matches something existing in the customer array
   * @param {object} customerInfo
   * @param {array} customerArray
   * @return {undefined}
   */
  function customerInCustomerList(customerInfo, customerArray) {
    var customerName = customerInfo.name;

    for (var i = 0; i < customerArray.length; i++) {
      var customerNameInArray = customerArray[i].name;

      if (customerName === customerNameInArray) {
        return true;
      }
    }

    return false;
  }

  /**
   * Main watcher for barcode scanner
   */
  $scope.$watch('model.barcodeScanned', function (newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    if ($scope.model.barcodeScanned.length < 7 && $scope.model.barcodeScanned.length !== 0) {
      alert('Please enter a real loaner barcode');
      $scope.model.barcodeScanned = '';
    } else {
      if ($scope.model.barcodeScanned) {
        //if barcode is correct format
        if ($scope.authenticateInput($scope.model.barcodeScanned)) {
          var barcode = $scope.model.barcodeScanned;
          var numbers = Number(barcode.substring(3));
          // if item is stored in loaner database
          if (model.loanerObject[numbers]) {
            // create loaner in pending obj
            $scope.model.pendingLoaners[numbers] = deepObjCopy(model.loanerObject[numbers]);
            //if unit is motor, hide fw stuff
            if ($scope.isMotor($scope.model.pendingLoaners[numbers].unit) || $scope.model.pendingLoaners[numbers].unit === 'LR2W' || $scope.model.pendingLoaners[numbers].unit === 'LR2M') { //roq - remove after matt updates firmware
              $scope.model.pendingLoaners[numbers].firmware = "NA";
              $scope.model.pendingLoaners[numbers].radio    = "NA";
              $scope.model.pendingLoaners[numbers].mods     = "NA";
              $scope.setStatus($scope.model.pendingLoaners[numbers], false);
            } else { //for all non-motors, properly sort out firmware
              $scope.getFirmware($scope.model.pendingLoaners[numbers], 'checkInOut');
            }
          } else { //if item isn't in loaner database
            $scope.createLoaner(numbers);
          }
          //reset input to empty
          $scope.model.barcodeScanned = '';
        } else {
          alert('Please enter a real loaner barcode');
          $scope.model.barcodeScanned = '';
        }
      }
    }
  });

  /**
   * Copes input object and returns a copy be value (not reference). Must be one level deep
   * @param {object} obj
   * @return {object}
   */
  function deepObjCopy(input) {
    var secondObj = {};

    for (var prop in input) {
      if (input.hasOwnProperty(prop)) {
          secondObj[prop] = input[prop];
      }
    }

    return secondObj;
  }


// FUNCTIONS FOR NEW UNITS===============================================================================================================
  //makes sure barcode is correct
  $scope.authenticateInput = function(input) {
    if (input.length != 7) {
      return false;
    } else {
      var letters = input.substring(0,3).toUpperCase();
      var numbers = input.substring(3);

      //if starting letters aren't PCS
      if (letters != 'PCS') {
        return false;
      }
      //if there aren't 4 numbers or the 4 characters aren't a number
      if ((numbers.length != 4) || (isNaN(Number(numbers)))) {
        return false;
      } else { //else number should be correct
        return true;
      }
    }
  }

  //creates new loaner if one doesn't exist in database
  $scope.createLoaner = function(newBarcode) {
    var newItem = {
      status      : '',
      unitBarcode : newBarcode,
      unit        : '',
      serialNum   : '',
      location    : 'not in database',
      firmware    : '',
      radio       : '',
      mods        : '',
      notes       : '',
      valid       : false,
      showCustomer: false,
      customerInfo: {
        name           : '',
        email          : '',
        phoneNum       : '',
        date           : '',
        repairNum      : '',
        notes          : '',
        shippingAddress: ''
      }
    }
    $scope.model.pendingLoaners[newBarcode] = newItem;
  }

  //populates serial number field w/ right prefix
  $scope.unitSelect = function(unit, type) {
    if(type === 'DMF3') {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'D3-';
    } else if(type === 'LR2') {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'LR';
    } else if(type === 'VIU') {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'VOU';
    } else if(type === 'VF3') {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'MF';
    } else if(type === 'DM2X') {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = '2X';
    } else if(type === "DMF2") {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'D';
    } else if(type === "VLC") {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'V';
    } else {
      $scope.model.pendingLoaners[unit.unitBarcode].serialNum = '';
    }

    $scope.setFocus(unit.unitBarcode);
  }

  //function for setting focus on particular serial number entry
  $scope.setFocus = function(id) {
    var input = $window.document.getElementById(id);
    input.focus();
  }

  //checks if serial number if valid
  $scope.serialNumCheck = function(unit) {
    var validSerial = $scope.checkSerialNum(unit.unit, unit.serialNum);
    $scope.model.pendingLoaners[unit.unitBarcode].valid = validSerial;
  }

  //submits serial nubmer to database
  $scope.submitToDatabase = function(unit, newStatus) {
    if (newStatus === 'makeUnit') {
      unit.location = "in house";
      unit.status   = "ready";
    } else if (newStatus === 'checkBackIn') {
      unit.location = "in house";
      unit.status   = "needs QA"
    } else if (newStatus === 'checkIn') {
      unit.location     = "in house";
      unit.status       = "ready";
      unit.customerInfo = {
        name           : '',
        email          : '',
        phoneNum       : '',
        date           : '',
        repairNum      : '',
        notes          : '',
        shippingAddress: ''
      }
    } else if (newStatus === 'checkOut') {
      unit.location = "checked out";
      unit.status   = "checked out";
    }

    unit.timestamp = firebase.database.ServerValue.TIMESTAMP;
    model.loanerReference.child(unit.unitBarcode).set(unit).then(function() {
      $scope.model.pendingLoaners[unit.unitBarcode].status = "Submitted";

      $timeout(function(){
        delete $scope.model.pendingLoaners[unit.unitBarcode];
        if (angular.equals($scope.pendingBarcodes, {})) {
        }
      }, 1300)
    });
  }

  //serial number check
  $scope.checkSerialNum = function(item, serial) {
    var shortBarcode = ['FI', 'HU3', 'MDR3', 'MDR4', 'RMF', 'DM1X', 'DM5', 'DM2', 'DM4X', 'MDR2', 'BM', 'HU4', 'LR2W', 'LR2M'];
    //if the item is one of the short barcode items
    if (shortBarcode.indexOf(item) >= 0) {
      if (!isNaN(serial) && (serial.length === 4) && (item != 'DM5')) {
        return true;
      } else if (!isNaN(serial) && (serial.length === 5) && (item==='DM5')) {
        return true;
      } else {
        return false;
      }
    } else if (item === 'LR2') { //if item is LR2 sensor
      var serialLetters  = serial.substring(0, 2);
      var numberLength   = serial.substring(2).length;
      var serialNumbers  = Number(serial.substring(2));
      var lettersCorrect = (serialLetters === 'LR');
      var numbersCorrect = (serialNumbers && numberLength===4);

      return lettersCorrect && numbersCorrect;
    } else if (item==='VIU') {
      var serialLetters  = serial.substring(0, 3);
      var numberLength   = serial.substring(3).length;
      var serialNumbers  = Number(serial.substring(3));
      var lettersCorrect = (serialLetters === 'VOU');
      var numbersCorrect = (serialNumbers && numberLength===4);

      return lettersCorrect && numbersCorrect;
    } else if (item==='DMF3') {
      var serialLetters  = serial.substring(0, 3);
      var numberLength   = serial.substring(3).length;
      var serialNumbers  = Number(serial.substring(3));
      var lettersCorrect = (serialLetters === 'D3-');
      var numbersCorrect = (serialNumbers && numberLength===4);

      return lettersCorrect && numbersCorrect;
    } else if (item==='VF3') {
      var serialLetters  = serial.substring(0, 2);
      var numberLength   = serial.substring(2).length;
      var serialNumbers  = Number(serial.substring(2));
      var lettersCorrect = (serialLetters === 'MF');
      var numbersCorrect = (serialNumbers && numberLength===5);

      return lettersCorrect && numbersCorrect;
    } else if(item==='DM2X') {
      var serialLetters  = serial.substring(0, 2);
      var numberLength   = serial.substring(2).length;
      var serialNumbers  = Number(serial.substring(2));
      var lettersCorrect = (serialLetters === '2X');
      var numbersCorrect = (serialNumbers && numberLength===4);

      return lettersCorrect && numbersCorrect;
    } else if(item==='DMF2') {
      var serialLetters  = serial.substring(0, 1);
      var numberLength   = serial.substring(1).length;
      var serialNumbers  = Number(serial.substring(1));
      var lettersCorrect = (serialLetters === 'D');
      var numbersCorrect = (serialNumbers && numberLength===5);

      return lettersCorrect && numbersCorrect;
    } else if(item==='VLC') {
      var serialLetters  = serial.substring(0, 1);
      var numberLength   = serial.substring(1).length;
      var serialNumbers  = Number(serial.substring(1));
      var lettersCorrect = (serialLetters === 'V');
      var numbersCorrect = (serialNumbers && numberLength===4);

      return lettersCorrect && numbersCorrect;
    }
  }

  // FUNCTIONS FOR NEW UNITS===============================================================================================================

  //removes item from list of pending loaner scans
  $scope.removeItem = function(unit) {
    delete $scope.model.pendingLoaners[unit.unitBarcode];
  }

  //checks if unit is motor
  $scope.isMotor = function(unitType) {
    var motors = ["DM2X", "DM1X", "DM1", "DM2", "DM5", "DM4X"];

    return motors.indexOf(unitType) !== -1;
  }

  //get firmware from API
    //key = key of loaner array (used only for inventory purposes, not check in/out)
    //unit = particular unit object
    //source = where the call was made (check in/out vs inventory)
  $scope.getFirmware = function(unit, source) {
    var unitType  = unit.unit;
    var serialNum = unit.serialNum;

    if (source !== 'checkInOut') {
      var unitIndex = model.loanerArray.indexOf(unit);

      model.loanerArray[unitIndex].firmware = 'pending';
      model.loanerArray[unitIndex].mods     = 'pending';
      model.loanerArray[unitIndex].radio    = 'pending';
    }

    //prepare unit type for api
    if (unitType === 'FI') {
      apiUnitType = 'F/I';
    } else if (unitType === 'MDR3') {
      apiUnitType = 'MDR-3';
    } else if (unitType === 'MDR2') {
      apiUnitType = 'MDR-2';
    } else if (unitType === 'MDR4') {
      apiUnitType = 'MDR-4';
    } else if (unitType === 'LR2') {
      apiUnitType = 'LR2';
    } else if (unitType === 'VIU') {
      apiUnitType = 'VI';
    } else if (unitType === 'VF3') {
      apiUnitType = 'VF3';
    } else if (unitType === 'BM') {
      apiUnitType = 'Updater';
    } else {
      apiUnitType = unitType;
    }

    // create URL for api call
    var generatedUrl = "https://secure-ocean-3120.herokuapp.com/api/v1/products/search?item=" + apiUnitType + "&serial=" + serialNum;
    $http.get(generatedUrl).then(function(response) {
      //if getting API info for the check in/out page
      if (source==='checkInOut') {
        $scope.checkApiResponse(unit, response);
      }
      //if getting API info for the inventory page
      else{
        $scope.invApiResponse(unit, response);
      }
    });
  }

  $scope.checkApiResponse = function(unit, response) {
    var unitType = unit.unit;

    if (response.data == null) {
      alert("Unit not in internal database. Enter into database then redo check in of unit.");
      delete $scope.model.pendingLoaners[unit.unitBarcode];
    } else {
      var noRadio   = ["LR2", "DMF3", "DMF2", "BM", "LR2W", "LR2M"];
      var withRadio = ["FI", "HU3", "MDR3", "MDR2", "MDR4", "VIU", "RMF", "VLC", "HU4"];
      var hasRadio  = (withRadio.indexOf(unitType)!==-1);

      if (!hasRadio) {
        $scope.model.pendingLoaners[unit.unitBarcode].radio = "NA";
      } else {
        $scope.model.pendingLoaners[unit.unitBarcode].radio = response.data.radio_fw_latest;
      }

      $scope.model.pendingLoaners[unit.unitBarcode].firmware = response.data.main_fw_latest;
      $scope.model.pendingLoaners[unit.unitBarcode].mods     = response.data.mods_latest;

      $scope.setStatus(unit, hasRadio);
    }
  };


// status: 'checked out' | 'needs QA' | 'ready' | 'update'
  $scope.setStatus = function(unit, hasRadio) {
    var unitStatus = unit.status;

    if (unitStatus === "ready") {
      if ($scope.isMotor(unit.unit) || unit.unit === "LR2W" || unit.unit === "LR2M") {
        $scope.model.pendingLoaners[unit.unitBarcode].status = "Ready to loan";
      } else if(((hasRadio && unit.radio) || !hasRadio) && unit.firmware && unit.mods){
        $scope.model.pendingLoaners[unit.unitBarcode].status = "Ready to loan";
      } else{
        $scope.model.pendingLoaners[unit.unitBarcode].status = "Needs updates";
      }
    } else if (unitStatus === 'needs QA') {
      if ($scope.isMotor(unit.unit)) {
        $scope.model.pendingLoaners[unit.unitBarcode].status = "Needs QA";
      } else if (((hasRadio && unit.radio) || !hasRadio) && unit.firmware && unit.mods) {
        $scope.model.pendingLoaners[unit.unitBarcode].status = "Needs QA";
      } else {
        $scope.model.pendingLoaners[unit.unitBarcode].status = "Needs updates & QA";
      }
    } else if (unitStatus === 'checked Out') {
      $scope.model.pendingLoaners[unit.unitBarcode].status = "Ready to be checked in";
    }
  }

  $scope.invApiResponse = function(unit, response) {
    //get index of unit in loaner array
    var unitIndex = model.loanerArray.indexOf(unit);
    var unitType  = model.loanerArray[unitIndex].unit;

    if (response.data === null) {
      if (!(unitType === 'DM1X' || unitType === 'DM2X' || unitType === 'DM2' || unitType === 'DM5' || unitType === 'DM4' || unitType === 'DM4X')) {
        alert("Unit not in internal database. Enter into database then redo check in of unit.");
      }

      model.loanerArray[unitIndex].firmware = 'NA';
      model.loanerArray[unitIndex].mods     = 'NA';
      model.loanerArray[unitIndex].radio    = 'NA';
    } else {
      var all = ["FI", "HU3", "MDR3", "MDR2", "MDR4", "VIU", "RMF", "VLC", "HU4"];
      var hasRadio = all.indexOf(unitType) !== -1;

      if (!hasRadio) {
        model.loanerArray[unitIndex].radio = "NA";
                          hasRadio         = false;
      } else { //else if unit does have a radio
        model.loanerArray[unitIndex].radio = response.data.radio_fw_latest ? response.data.radio_fw_latest : false;
                          hasRadio         = model.loanerArray[unitIndex].radio;
      }
      //update firmware and mods info for unit
      model.loanerArray[unitIndex].firmware = response.data.main_fw_latest ? response.data.main_fw_latest : false;
      model.loanerArray[unitIndex].mods     = response.data.mods_latest    ? response.data.mods_latest    : false;
    }
  };


  $scope.custImport = function(unit, custInfo) {
    var singleLoaner = $scope.model.pendingLoaners[unit.unitBarcode].customerInfo;

    if (custInfo === 'reset') {
      singleLoaner.name = '';
      singleLoaner.phoneNum = '';
      singleLoaner.email = '';
      singleLoaner.repairNum = '';
      singleLoaner.shippingAddress = '';
      singleLoaner.notes = '';
    }

    if (custInfo.name) {
      singleLoaner.name = custInfo.name;
    }

    if (custInfo.phoneNum) {
      singleLoaner.phoneNum = custInfo.phoneNum;
    }

    if (custInfo.email) {
      singleLoaner.email = custInfo.email;
    }

    if (custInfo.repairNum) {
      singleLoaner.repairNum = custInfo.repairNum;
    }

    if (custInfo.shippingAddress) {
      singleLoaner.shippingAddress = custInfo.shippingAddress;
    }

    if (custInfo.notes) {
      singleLoaner.notes = custInfo.notes;
    }
  }

  $scope.deleteFromDatabase = function(unit) {
    var confirmDelete = window.confirm('Are you sure you want to delete this unit?');

    if (confirmDelete) {
      model.loanerReference.child(unit.unitBarcode).remove();
      delete $scope.model.pendingLoaners[unit.unitBarcode];
    }
  }
}]);
