barcodeApp.controller('InventoryScannerController', ['$scope','$rootScope','$firebaseArray','$firebaseObject','$timeout','$http','$window','$uibModal','$q', function ($scope, $rootScope, $firebaseArray, $firebaseObject, $timeout, $http, $window, $uibModal, $q) {

  //
  // Controller model
  //

  var model = {
    accessoryCategories: ['A', 'G', 'L', 'M'],
    unitStatus         : {
      0: 'checked out - purchase',
      1: 'checked out - other',
      2: 'on shelf',
      3: 'missing'
    },
    includesRadio   : ['FI', 'HU3', 'HU4', 'MDR3', 'MDR4', 'LR2 VIU'],
    FIRMWARE_API    : 'https://secure-ocean-3120.herokuapp.com/api/v1/products/search?item=',
    shortBarcodeList: ['FI', 'HU3', 'MDR3', 'MDR4', 'RMF', 'DM1X', 'DM5', 'BM', 'HU4', 'LR2W', 'LR2M']
  }

  //
  // View Model
  //

  $scope.model = {
    loaded         : false,
    pendingBarcodes: {},
    barcodeNum     : '',
    barcodeEntered : false,
    isManualEntry  : false
  }

  //------------- Import Firebase Information -------------

  //product invnetory from Firebase
  $scope.barcodedUnitInfo = firebase.database().ref().child('inventory');
  $scope.barcodedUnits    = $firebaseArray($scope.barcodedUnitInfo);

  //cable invnetory from Firebase
  $scope.barcodedCableInfo = firebase.database().ref().child('cableInventory');
  $scope.barcodedCablesObj = $firebaseObject($scope.barcodedCableInfo);

  //accessory invnetory from Firebase
  $scope.barcodedAccessoryInfo = firebase.database().ref().child('accessoryInventory');
  $scope.barcodedAccessoriesObj = $firebaseObject($scope.barcodedAccessoryInfo);


  /**
   * Mark as loaded when firebase items are all loaded
   * @return {undefined}
   */
  $scope.barcodedUnits.$loaded().then(function() {
    $scope.model.loaded = true;
    setFocus();
  });


  /**
   * Watcher for barcode input
   * @return {undefined}
   */
  $scope.$watch('model.barcodeNum', function() {
    if ($scope.model.barcodeNum) {
      if (!$scope.model.isManualEntry) {
        $scope.prepareScannedInput($scope.model.barcodeNum)
      }
    }
  });

  /**
   * Checks scanned input and adds to pending if correct
   * @return {undefined}
   */
  $scope.prepareScannedInput = function() {
    if ($scope.authenticateInput($scope.model.barcodeNum)) {
      $scope.model.barcodeEntered = true;

      //if unit, make correctly formatted object key
      if ($scope.model.barcodeNum.split(" ").length > 1) {
        var simplifiedKey = simplifyKey($scope.model.barcodeNum);
        var ogKey         = $scope.model.barcodeNum;
        //run check against firebase to get stored status and make new object
        runCheck(simplifiedKey, ogKey);
      } else {
        addCableAcessory($scope.model.barcodeNum);
      }

      playAudio('scanned');
    } else {
      playAudio('alanna');
      alert('Barcode Incorrect. Try again.');
    }

    $scope.model.barcodeNum = '';
  }

  $scope.adminEditUnit = function(unit) {
    if (!$rootScope.adminLoggedIn) {
      return;
    } else {
      function editUnitModal(unit) {
        return modalInstance = $uibModal.open({
          controller  : 'EditUnitController',
          templateUrl : '../templates/edit-unit.tpl.html',
          size        : 'md',
          resolve     : {
            unit : function() {
              return unit;
            }
          }
        });
      }
    }

    editUnitModal(unit).result.then(function(status) {
      if (!status) {
        return;
      } else {
        $scope.barcodedUnitInfo.child(unit.serial).set({
          barcode  : unit.barcode,
          serial   : unit.serial,
          status   : status,
          unit     : unit.unit,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(function() {
          $scope.model.pendingBarcodes[unit.serial].status = 'Saved';
          $scope.$apply();

          $timeout(function() {
            delete $scope.model.pendingBarcodes[unit.serial];
            if(angular.equals($scope.model.pendingBarcodes, {})) {
              $scope.model.barcodeEntered = false;
            }
          }, 3000)
        })
      }
    })
  }

  /**
   * Checks if serial number is correct
   * @param {string} item
   * @param {string} serial
   * @return {bool}
   */
  function checkSerialNum(item, serial) {
    //if the item is one of the short barcode items
    if (model.shortBarcodeList.indexOf(item) > -1) {
      if(!isNaN(serial) && (serial.length === 4) && (item != 'DM5')) {
        return true;
      } else if (!isNaN(serial) && (serial.length === 5) && (item==='DM5')) {
        return true;
      } else {
        alert('Please use the correct type and number of characters (four numbers)')
        return false;
      }
    } else if (item==='LR2 Sensor') {
      var serialLetters = serial.substring(0, 2);
      var numberLength  = serial.substring(2).length;
      var serialNumbers = Number(serial.substring(2));

      var lettersCorrect = (serialLetters === 'LR');
      var numbersCorrect = (serialNumbers && numberLength===4);

      if(lettersCorrect && numbersCorrect) {
        return true;
      }
      else{
        alert('Please use the correct type and number of characters')
        return false;
      }
    } else if (item==='LR2 VIU') {
      var serialLetters = serial.substring(0, 3);
      var numberLength  = serial.substring(3).length;
      var serialNumbers = Number(serial.substring(3));

      var lettersCorrect = (serialLetters === 'VOU');
      var numbersCorrect = (serialNumbers && numberLength===4);

      if (lettersCorrect && numbersCorrect) {
        return true;
      } else {
        alert('Please use the correct type and number of characters')
        return false;
      }
    } else if (item==='DMF3') {
      var serialLetters = serial.substring(0, 3);
      var numberLength  = serial.substring(3).length;
      var serialNumbers = Number(serial.substring(3));

      var lettersCorrect = (serialLetters === 'D3-');
      var numbersCorrect = (serialNumbers && numberLength===4);

      if (lettersCorrect && numbersCorrect) {
        return true;
      } else {
        alert('Please use the correct type and number of characters')
        return false;
      }
    } else if (item==='VF3') {
      var serialLetters = serial.substring(0, 2);
      var numberLength  = serial.substring(2).length;
      var serialNumbers = Number(serial.substring(2));

      var lettersCorrect = (serialLetters === 'MF');
      var numbersCorrect = (serialNumbers && numberLength===5);

      if (lettersCorrect && numbersCorrect) {
        return true;
      } else {
        alert('Please use the correct type and number of characters')
        return false;
      }
    } else if (item==='DM2X') {
      var serialLetters = serial.substring(0, 2);
      var numberLength  = serial.substring(2).length;
      var serialNumbers = Number(serial.substring(2));

      var lettersCorrect = (serialLetters === '2X');
      var numbersCorrect = (serialNumbers && numberLength===4);

      if (lettersCorrect && numbersCorrect) {
        return true;
      } else {
        alert('Please use the correct type and number of characters')
        return false;
      }
    }
  }

  /**
   * Authenticate input
   * @param {string} input
   * @param {string} src
   * @return {bool}
   */
  $scope.authenticateInput = function(input, src) {
    var parsedItem = input.split(" ");
    //accessory or cable
    if (parsedItem.length === 1) {
      var identifier = parsedItem[0].toUpperCase();
      if (identifier[0] === "C" || model.accessoryCategories.indexOf(identifier[0]) !== -1) {
        return true;
      }
    } else if (parsedItem.length === 3) {
      var barcodeLetters  = ['FI', 'HU3', 'MDR3', 'MDR4', 'LR2', 'DMF3', 'RMF', 'VF3', 'DM1X', 'DM2X', 'DM5', 'BM', 'LR2W', 'HU4', 'LR2M'];
      var unitType        = parsedItem[0];
      var unitTrue        = barcodeLetters.indexOf(unitType) >= 0;
      var serialLabelTrue = (parsedItem[1] === 's/n');

      if (parsedItem[2][0]==="L") {
        unitType = 'LR2 Sensor';
      } else if (parsedItem[2][0]==="V") {
        unitType = 'LR2 VIU';
      }

      var checkNums = checkSerialNum(unitType, parsedItem[2]);

      if (unitTrue && serialLabelTrue && checkNums) {
        if (src != 'invChecker') {
          getFirmware(unitType, parsedItem[2]);
        }
        return true;
      } else{
        return false;
      }
    } else {
      //not a real barcode
      alert('Please enter a real product barcode');
      return false;
    }
  };

  /**
   * Gets firmware from Preston backenc
   * @param {string} unitType
   * @param {string} serialNum
   * @return {undefined}
   */
  function getFirmware(unitType, serialNum) {
    //prepare unit type for api
    var apiUnitType;
    var constructedName;
    var pendingBarcodeName;

    switch (unitType) {
      case 'FI':
        apiUnitType = 'F/I';
        break;
      case 'MDR3':
        apiUnitType = 'MDR-3';
        break;
      case 'MDR4':
        apiUnitType = 'MDR-4';
        break;
      case 'LR2 Sensor':
        apiUnitType = 'LR2';
        break;
      case 'LR2 VIU':
        apiUnitType = 'VI';
        break;
      case 'VF3':
        apiUnitType = 'VF3';
        break;
      case 'BM':
        apiUnitType = 'Updater';
        break;
      case 'LR2W':
        apiUnitType = 'LR2W';
        break;
      case 'LR2M':
        apiUnitType = 'LR2M';
        break;
      default:
        apiUnitType = unitType;
        break;
    }

    //create URL for api call
    var generatedUrl = model.FIRMWARE_API + apiUnitType + "&serial=" + serialNum;

    $http.get(generatedUrl).then(function(response) {
      //if item isn't in preston database (i.e. hasn't been QA'd)
      if (response.data == null) {
        alert("not in database")
      } else if (response.data.item === 'DM1X' || response.data.item === 'DM2X' || response.data.item === 'DM5') {
        constructedName    = unitType + ' s/n ' + serialNum;
        pendingBarcodeName = simplifyKey(constructedName);
        $scope.model.pendingBarcodes[pendingBarcodeName].notMotor = false;
        $scope.model.pendingBarcodes[pendingBarcodeName].notes    = response.data.notes;
      } else {
        if (unitType === 'LR2 Sensor' || unitType === 'LR2 VIU') {
          constructedName = 'LR2 s/n ' + serialNum;
        } else {
          constructedName = unitType + ' s/n ' + serialNum;
        }

        pendingBarcodeName = simplifyKey(constructedName);

        $scope.model.pendingBarcodes[pendingBarcodeName].latestMainFW  = response.data.main_fw_latest  ? response.data.main_fw_latest  : false;
        $scope.model.pendingBarcodes[pendingBarcodeName].latestRadioFW = response.data.radio_fw_latest ? response.data.radio_fw_latest : false;
        $scope.model.pendingBarcodes[pendingBarcodeName].modsLatest    = response.data.mods_latest     ? response.data.mods_latest     : false ;
        $scope.model.pendingBarcodes[pendingBarcodeName].fwLink        = "https://secure-ocean-3120.herokuapp.com" + response.data.url;
        $scope.model.pendingBarcodes[pendingBarcodeName].infoPulled    = true;
        $scope.model.pendingBarcodes[pendingBarcodeName].notes         = response.data.notes;
        $scope.model.pendingBarcodes[pendingBarcodeName].hasRadio      = includesRadio(unitType);
      }
    });
  }

  /**
   * Determines if a unit has a radio
   * @param {strong} unitType
   * @return {bool}
   */
  function includesRadio(unit) {
    return model.includesRadio.indexOf(unit) > -1;
  }

  /**
   * Checks if unit is already in database and adds to list accordingly
   * @param {string} item
   * @param {string} barcode
   * @return {undefined}
   */
  function runCheck(item, ogKey) {
    for (var i = 0; i<$scope.barcodedUnits.length; i++) {
      //if item is already stored in database
      if ($scope.barcodedUnits[i].$id === item) {
        //make new object entry
        $scope.model.pendingBarcodes[item] = {
          serial            : item,
          status            : $scope.barcodedUnits[i].status,
          barcode           : ogKey,
          latestMainFW      : false,
          latestRadioFW     : false,
          infoPulled        : false,
          needMainFW        : false,
          needRadioFW       : false,
          notMotor          : true,
          unit              : $scope.barcodedUnits[i].unit,
          checkingUnit      : false
        };
        break;
      } else {
        //if item is getting scanned for the first time
        $scope.model.pendingBarcodes[item] = {
          serial            : item,
          status            : 'unchecked',
          barcode           : ogKey,
          latestMainFW      : false,
          latestRadioFW     : false,
          infoPulled        : false,
          needMainFW        : false,
          needRadioFW       : false,
          notMotor          : true,
          unit              : ogKey.split(" ")[0].toLowerCase(),
          checkingUnit      : false
        };
      }
    }
  };

  /**
   * Opens keypad modal
   * @param {string} item
   * @param {bool} inDatabase
   * @param {number} number
   * @return {Promise}
   */
  function keypadModal(item, inDatabase, number) {
    return modalInstance = $uibModal.open({
      controller  : 'KeypadModalCtrl',
      templateUrl : '../templates/keypadModal.tpl.html',
      size        : 'md',
      resolve     : {
        item : function() {
          return item;
        },
        prevNumber : function() {
          return number;
        },
        inDatabase : function() {
          return inDatabase;
        }
      }
    });
  };

  /**
   * Edits number of units for cables/accessories
   * @param {string} barcode
   * @return {undefined}
   */
  $scope.editNumber = function(barcode) {
    var prevNumber = $scope.model.pendingBarcodes[barcode].newNumber;
    var inDatabase = $scope.barcodedCablesObj[barcode] || $scope.barcodedAccessoriesObj[barcode] || false;

    keypadModal(barcode, inDatabase, prevNumber).result.then(function(response) {
      $scope.model.pendingBarcodes[barcode].newNumber = parseInt(response);
    });
  };

  /**
   * Add cable or accessory to pending list
   * @param {string} item
   * @return {undefined}
   */
  function addCableAcessory(item) {
    var parsedItem = item.split(" ");
    var barcode    = parsedItem[0].toUpperCase();

    if (barcode[0] === "C") {
      //if cable is already in firebase
      if ($scope.barcodedCablesObj[barcode]) {
        $scope.model.pendingBarcodes[barcode] =  $scope.barcodedCablesObj[barcode];
        keypadModal(barcode, true).result.then(function(response) {
          $scope.model.pendingBarcodes[barcode].newNumber = parseInt(response);
        })
      } else {
        var id = barcode.substring(1);

        $scope.model.pendingBarcodes[barcode] = {
          barcode     : barcode,
          inStock     : 0,
          id          : id,
          type        : "cable",
          status      : 'unchecked',
          checkingUnit: false
        }

        keypadModal(barcode, false).result.then(function(response) {
          $scope.model.pendingBarcodes[barcode].newNumber = parseInt(response);
        });
      }
    } else if (model.accessoryCategories.indexOf(barcode[0]) !== -1) {
      //if accessory is already in firebase
      if ($scope.barcodedAccessoriesObj[barcode]) {
        $scope.model.pendingBarcodes[barcode] =  $scope.barcodedAccessoriesObj[barcode];
        keypadModal(barcode, true).result.then(function(response) {
          $scope.model.pendingBarcodes[barcode].newNumber = parseInt(response);
        })
      } else {
        var id = barcode.substring(1);

        $scope.model.pendingBarcodes[barcode] = {
          barcode     : barcode,
          inStock     : 0,
          id          : id,
          type        : 'accessory',
          status      : 'unchecked',
          category    : returnAccessoryType(barcode),
          checkingUnit: false
        }

        keypadModal(barcode, false).result.then(function(response) {
          $scope.model.pendingBarcodes[barcode].newNumber = parseInt(response);
        })
      }
    } else {
      alert('Barcode incorrect');
    }
  }

  /**
   * Takes in input, returns accessory type according to input
   * @param {string} barcode
   * @return {(string|undefined)}
   */
  function returnAccessoryType(barcode) {
    if (model.accessoryCategories.indexOf(barcode[0]) === -1) {
      return;
    }

    switch(barcode[0]) {
      case 'A':
          return 'other'
      case 'M':
          return 'motor mounts'
      case 'G':
          return 'gears'
      case 'L':
          return 'light ranger 2'
    }
  }

  /**
   * Converts string input
   * @param {string} item
   * @return {string} correctly formatted item
   */
  function simplifyKey(item) {
    var parsedItem = item.split(" ");
    var unitType   = parsedItem[0];
    var unitSerial = parsedItem[2];

    return unitType.toLowerCase() + "_" + unitSerial;
  };

  /**
   * Plays audio file based on action
   * @param {string} sound
   * @returnb {undefined}
   */
  function playAudio(sound) {
    var audio;

    switch (sound) {
      case 'checkedIn':
        audio = new Audio('../audio/checkedIn.wav');
        break;
      case 'checkedOut':
        audio = new Audio('../audio/checkedOut.wav');
        break;
      case 'removed':
        audio = new Audio('../audio/removed.wav');
          break;
      case 'scanned':
        audio = new Audio('../audio/scanned.wav');
        break;
      case 'wrong':
        audio = new Audio('../audio/noBarcode.wav');
        break;
      case 'removeThemAll':
        audio = new Audio('../audio/explosion.wav');
        break;
      case 'alanna':
        audio = new Audio('../audio/alanna.wav');
        break;
    }

    audio.play();
  };

  /**
   * Check a unit in/out to firebase
   * @param {object} unit
   * @param {bool} checkingIn - true if checking unit in, false if checking unit out
   * @param {string} option - option for checking out
   * @return {undefined}
   */
  function setUnitInOut(unit, checkingIn, option) {
    // Unit in the process of getting checked in or out
    $scope.model.pendingBarcodes[unit.serial].checkingUnit = true;

    //create object components
    var unitBarcode = unit.barcode;
    var unitSerial  = unit.serial;
    var unitType    = unit.unit;
    var unitStatus  = checkingIn ? 'on shelf' : 'checked out - ' + option;

    //set object in firebase
    $scope.barcodedUnitInfo.child(unitSerial).set({
      barcode  : unitBarcode,
      serial   : unitSerial,
      status   : unitStatus,
      unit     : unitType,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(successCallback(unit), failCallback());
  }


  /**
   * Check number of cables in/out
   * @param {object} unit
   * @param {bool} checkingIn - determines if a unit is being checked in or out
   * @return {undefined}
   */
  function setCableInOut(unit, checkingIn) {
    var currentStock = unit.inStock;
    var unitSerial   = unit.barcode;

    // Unit in the process of getting checked in or out
    $scope.model.pendingBarcodes[unit.barcode].checkingUnit = true;


    // Create new stock based in checking in/out
    if (checkingIn) {
      $scope.model.pendingBarcodes[unit.barcode].inStock = currentStock + unit.newNumber;
    } else {
      $scope.model.pendingBarcodes[unit.barcode].inStock = currentStock - unit.newNumber;
    }

    $scope.barcodedCableInfo.child(unitSerial).set({
      barcode  : unit.barcode,
      inStock  : unit.inStock,
      id       : unit.id,
      type     : "cable",
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(successCallback(unit), failCallback());
  }

  /**
   * Check number of accessories in/out
   * @param {object} unit
   * @param {bool} checkingIn
   * @return {undefined}
   */
  function setAccessoryInOut(unit, checkingIn) {
    var currentStock = unit.inStock;
    var unitSerial   = unit.barcode;

    // Unit in the process of getting checked in or out
    $scope.model.pendingBarcodes[unit.barcode].checkingUnit = true;


    // Create new stock based in checking in/out
    if (checkingIn) {
      $scope.model.pendingBarcodes[unit.barcode].inStock = currentStock + unit.newNumber;
    } else {
      $scope.model.pendingBarcodes[unit.barcode].inStock = currentStock - unit.newNumber;
    }

    $scope.barcodedAccessoryInfo.child(unitSerial).set({
      barcode   : unit.barcode,
      inStock   : unit.inStock,
      id        : unit.id,
      type      : "accessory",
      timestamp : firebase.database.ServerValue.TIMESTAMP,
      category  : unit.category
    }).then(successCallback(unit), failCallback());
  }

  /**
   * Callback for when saving is finished
   * @param {object} unit
   * @return {undefined}
   */
  function successCallback(unit) {
    $timeout(function() {
      $scope.model.pendingBarcodes[unit.barcode].checkingUnit = false;
      delete $scope.model.pendingBarcodes[unit.barcode];
      if(angular.equals($scope.model.pendingBarcodes, {})) {
        $scope.model.barcodeEntered = false;
      }
    }, 3000)
  }

  function failCallback() {
    alert('Oops, something happened. Please refresh and try again.');
  }


  /**
   * Check in unit
   * @param {object} unit
   * @return {undefined}
   */
  $scope.checkIn = function(unit) {
    setFocus();

    if (!unit.type) {
      setUnitInOut(unit, true);
    }

    if (unit.type === 'cable') {
      setCableInOut(unit, true);
    }

    if (unit.type === 'accessory') {
      setAccessoryInOut(unit, true);
    }
  }

  /**
   * Checks units out
   * @param {object} unit
   * @param {bool} option
   * @return {undefined}
   */
  $scope.checkOut = function(unit, option) {
    setFocus();

    if (!unit.type) {
      setUnitInOut(unit, false, option);
    }

    // If unit is a cable
    if (unit.type === 'cable') {
      var newStock = unit.inStock -  unit.newNumber;

      if (newStock < 0) {
        alert('You cannot checkout more cables than what is crrently in stock (' + unit.inStock + ' currently in stock).');
        playAudio('wrong');
        $scope.model.pendingBarcodes[unit.barcode].newNumber = 0;
        return;
      }

      setCableInOut(unit, false);
    }

    // If unit is an accessory
    if (unit.type === 'accessory') {
      var newStock = unit.inStock -  unit.newNumber;

      if (newStock < 0) {
        alert('You cannot checkout more accessories than what is crrently in stock (' + unit.inStock + ' currently in stock).');
        playAudio('wrong');
        $scope.model.pendingBarcodes[unit.barcode].newNumber = 0;
        return;
      }

      setAccessoryInOut(unit, false);
    }
  }

  /**
   * Remove unit from list
   * @param {object} unit
   * @return {undefined}
   */
  $scope.remove = function(unit) {
    playAudio('removed')
    setFocus();

    if (unit.type) {
      delete $scope.model.pendingBarcodes[unit.barcode];
    } else {
      delete $scope.model.pendingBarcodes[unit.serial];
    }
  };

  /**
   * Sets focus on scan input
   * @return {undefined}
   */
  function setFocus() {
    var input = $window.document.getElementById('scanInput');
    input.focus();
  }

  /**
   * Removes all units from pending
   * @return {undefined}
   */
  $scope.removeAllUnits = function() {
    playAudio('removeThemAll');
    $scope.model.pendingBarcodes = {};
  }
}])
.controller('KeypadModalCtrl', ['$scope', '$uibModalInstance', 'item', 'prevNumber', 'inDatabase', function($scope, $uibModalInstance, item, prevNumber, inDatabase) {

  $scope.model      = '';
  $scope.inDatabase = inDatabase;
  $scope.item       = item;

  $scope.numberClicked = function(number) {
    if ($scope.model.length >= 3) {
      alert('You may not enter more than 3 digits.');
      return;
    }
    $scope.model = $scope.model + number;
  };

  $scope.delete = function() {
    $scope.model = $scope.model.slice(0, -1);
  };

  $scope.enter = function() {
    if (!$scope.model) {
      $uibModalInstance.close(0);
    } else {
      $uibModalInstance.close($scope.model);
    }
  };

  $scope.cancel = function() {
    if (prevNumber) {
      $uibModalInstance.close(prevNumber);
    } else {
      $uibModalInstance.close(0)
    }
  };
}])
.filter('numkeys', function() {
  return function(object) {
    return Object.keys(object).length;
  }
});
