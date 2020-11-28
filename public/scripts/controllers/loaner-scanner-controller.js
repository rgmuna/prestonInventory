barcodeApp.controller('LoanerScannerController', ['$scope','$rootScope','$firebaseArray','$firebaseObject','$timeout','$http','$window', function ($scope, $rootScope, $firebaseArray, $firebaseObject, $timeout, $http, $window) {

  //
  // Controller Model
  //

  var model = {
    loanerReference: null,
    loanerObject   : null,
    loanerArray    : null,
    BARCODE_LENGTH : 7,
    hasRadio       : ['FI', 'HU3', 'MDR3', 'MDR2', 'MDR4', 'VIU', 'RMF', 'VLC', 'HU4'],
    VIEW_STATUS    : {
      READY_TO_LOAN   : 'Ready to Loan',
      NEEDS_UPDATES   : 'Needs Updates',
      NEEDS_UPDATES_QA: 'Needs Updates & QA',
      NEEDS_QA        : 'Needs QA',
      READY_CHECK_IN  : 'Ready to Check In'
    }
  };

  //
  // View Model
  //

  $scope.model = {
    loaded          : false,
    barcodeScanned  : '',
    pendingLoaners  : {},
    customerList    : [],
    loanerProducts  : [
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

    if ($scope.model.barcodeScanned.length < model.BARCODE_LENGTH && $scope.model.barcodeScanned.length !== 0) {
      alert('Please enter a real loaner barcode');
      $scope.model.barcodeScanned = '';
      return;
    }

    // If new value isn't zero
    if ($scope.model.barcodeScanned) {
      //if barcode is correct format
      if (authenticateInput($scope.model.barcodeScanned)) {
        var barcode = $scope.model.barcodeScanned;
        var numbers = Number(barcode.substring(3));
        // if item is stored in loaner database
        if (model.loanerObject[numbers]) {
          // create loaner in pending obj
          $scope.model.pendingLoaners[numbers] = deepObjCopy(model.loanerObject[numbers]);

          // Set to loading
          $scope.model.pendingLoaners[numbers].loading = true;

          //if unit is motor, hide fw stuff
          if (isMotor($scope.model.pendingLoaners[numbers].unit) || $scope.model.pendingLoaners[numbers].unit === 'LR2W' || $scope.model.pendingLoaners[numbers].unit === 'LR2M') { //roq - remove after matt updates firmware
            $scope.model.pendingLoaners[numbers].firmware = 'NA';
            $scope.model.pendingLoaners[numbers].radio    = 'NA';
            $scope.model.pendingLoaners[numbers].mods     = 'NA';
            $scope.model.pendingLoaners[numbers].loading  = false;

            setViewStatus($scope.model.pendingLoaners[numbers], false);
          } else { //for all non-motors, properly sort out firmware
            getFirmware($scope.model.pendingLoaners[numbers]);
          }
        } else { //if item isn't in loaner database
          createLoaner(numbers);
        }
      } else {
        alert('Please enter a real loaner barcode');
      }
    }

    $scope.model.barcodeScanned = '';
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

  /*
    Functions for new units
  */

  /**
   * Checks if input barcode is correct
   * @private
   * @param {string} input
   * @return {bool}
   */
  function authenticateInput(input) {
    if (input.length != model.BARCODE_LENGTH) {
      return false;
    }

    var letters = input.substring(0,3).toUpperCase();
    var numbers = input.substring(3);

    //if starting letters aren't PCS
    if (letters != 'PCS') {
      return false;
    }

    //if there aren't 4 numbers or the 4 characters aren't a number
    if ((numbers.length != 4) || (isNaN(Number(numbers)))) {
      return false;
    }

    return true;
  }

  /**
   * Creates new loaner if it doesn't current exist in the database
   * @param {string} newBarcode
   * @return {undefined}
   */
  function createLoaner(newBarcode) {
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

  /**
   * Populates serial number field w/ right prefix
   * @param {object} unit
   * @param {string} type
   * @return {undefined}
   */
  $scope.unitSelect = function(unit, type) {
    switch (type) {
      case 'DMF3':
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'D3-';
        break;
      case 'LR2':
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'LR';
        break;
      case 'VIU':
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'VOU';
        break;
      case 'VF3':
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'MF';
        break;
      case 'DM2X':
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = '2X';
        break;
      case "DMF2":
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'D';
        break;
      case "VLC":
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = 'V';
        break;
    default:
        $scope.model.pendingLoaners[unit.unitBarcode].serialNum = '';
        break;
    }

    setFocus(unit.unitBarcode);
  }

  /**
   * Function for setting focus on particular serial number entry
   * @param {string} id - unit barcode
   * @returnb {undefined}
   */
  function setFocus(id) {
    var input = $window.document.getElementById(id);
    input.focus();
  }

  /**
   * Checks if input serial number if correct and sets on object
   * @param {object} unit
   * @return {undefined}
   */
  $scope.serialNumCheck = function(unit) {
    var validSerial = checkSerialNum(unit.unit, unit.serialNum);
    $scope.model.pendingLoaners[unit.unitBarcode].valid = validSerial;
  }

  /**
   * Submit unit to database
   * @param {object} unit
   * @param {string} newStatus
   * @return {undefined}
   */
  $scope.submitToDatabase = function(unit, newStatus) {
    $scope.model.pendingLoaners[unit.unitBarcode].loading = true;

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
      $scope.removeItem(unit);
    });
  }

  /**
   * Checks validity of serial number
   * @param {string} item - unit type
   * @param {string} serial - unit's serial number
   * @return {bool}
   */
  function checkSerialNum(item, serial) {
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

  /**
   * Checks if unit is a motor
   * @param {string} unitType
   * @return {undefined}
   */
  function isMotor(unitType) {
    var motors = ["DM2X", "DM1X", "DM1", "DM2", "DM5", "DM4X"];

    return motors.indexOf(unitType) !== -1;
  }

  /**
   * Get unit's firmware from API
   * @param {object} unit
   * @return {undefined}
   */
  function getFirmware(unit) {
    var unitType  = unit.unit;
    var serialNum = unit.serialNum;

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
      processApiResponse(unit, response);
    });
  }

  /**
   * Sets view status for unit depending on current status and firmware status
   * @param {object} unit
   * @param {bool} hasRadio
   * @return {undefined}
   */
  function setViewStatus(unit, hasRadio) {
    var unitStatus = unit.status;

    switch (unitStatus) {
      case 'ready':
        if (isMotor(unit.unit) || unit.unit === "LR2W" || unit.unit === "LR2M") { // ROQ - remove this after matt adds firmware for this
          $scope.model.pendingLoaners[unit.unitBarcode].viewStatus = model.VIEW_STATUS.READY_TO_LOAN;
        } else if(((hasRadio && unit.radio) || !hasRadio) && unit.firmware && unit.mods){
          $scope.model.pendingLoaners[unit.unitBarcode].viewStatus = model.VIEW_STATUS.READY_TO_LOAN;
        } else {
          $scope.model.pendingLoaners[unit.unitBarcode].viewStatus = model.VIEW_STATUS.NEEDS_UPDATES;
        }
        break;
      case 'needs QA':
        if (isMotor(unit.unit)) {
          $scope.model.pendingLoaners[unit.unitBarcode].viewStatus = model.VIEW_STATUS.NEEDS_QA;
        } else if (((hasRadio && unit.radio) || !hasRadio) && unit.firmware && unit.mods) {
          $scope.model.pendingLoaners[unit.unitBarcode].viewStatus = model.VIEW_STATUS.NEEDS_QA;
        } else {
          $scope.model.pendingLoaners[unit.unitBarcode].viewStatus = model.VIEW_STATUS.NEEDS_UPDATES_QA;
        }
        break;
      case 'checked out':
        $scope.model.pendingLoaners[unit.unitBarcode].viewStatus = model.VIEW_STATUS.READY_CHECK_IN;
        break;
      default:
        break;
    }

    $scope.model.pendingLoaners[unit.unitBarcode].loading      = false;
    $scope.model.pendingLoaners[unit.unitBarcode].showCustomer = setShowCustomerInfo($scope.model.pendingLoaners[unit.unitBarcode].viewStatus);
  }

  /**
   * Shows customer info depending on view status
   * @param {string} viewStatus
   * @return {bool}
   */
  function setShowCustomerInfo(viewStatus) {
    return viewStatus !== model.VIEW_STATUS.NEEDS_UPDATES;
  }

  /**
   * Addes API response info to particular unit
   * @param {object} unit
   * @param {object} response - server response
   * @return {undefined}
   */
  function processApiResponse(unit, response) {
    var unitType = unit.unit;

    if (response.data == null) {
      alert("Unit not in internal database. Enter into database then redo check in of unit.");
      delete $scope.model.pendingLoaners[unit.unitBarcode];
      return;
    }

    var withRadio = model.hasRadio;
    var hasRadio  = withRadio.indexOf(unitType) !== -1;

    $scope.model.pendingLoaners[unit.unitBarcode].radio    = hasRadio ? response.data.radio_fw_latest : 'NA';
    $scope.model.pendingLoaners[unit.unitBarcode].firmware = response.data.main_fw_latest;
    $scope.model.pendingLoaners[unit.unitBarcode].mods     = response.data.mods_latest;

    setViewStatus(unit, hasRadio);
  };


  /**
   * Import existing customer info to unit
   * @param {object} unit
   * @param {object} custInfo
   * @return {undefined}
   */
  $scope.custImport = function(unit, custInfo) {
    var singleLoaner = $scope.model.pendingLoaners[unit.unitBarcode].customerInfo;

    if (custInfo === 'reset') {
      $scope.model.pendingLoaners[unit.unitBarcode].selectedCustomer = '';
      singleLoaner.name = '';
      singleLoaner.phoneNum = '';
      singleLoaner.email = '';
      singleLoaner.repairNum = '';
      singleLoaner.shippingAddress = '';
      singleLoaner.notes = '';
      return;
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
