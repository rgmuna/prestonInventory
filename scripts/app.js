var barcodeApp = angular.module('barcodeApp', [
  'barcode',
  'ui.bootstrap',
  'ngAnimate',
  'ngSanitize',
  'ui.router',
  'firebase',
  'duScroll',
  'hl.sticky',
  'duScroll'

])



.directive('ngEnter', function () {
  return function (scope, element, attrs) {
    element.bind("keydown keypress", function (event) {
      if(event.which === 13) {
        scope.$apply(function (){
          scope.$eval(attrs.ngEnter);

          //script for resetting serial number while still including letters
          var reset = '';
          for(var i=0; i<scope.chosenItems.serialNum.length; i++){
            if(scope.chosenItems.unitSelect === "DMF3" && (i===1)){
              reset += scope.chosenItems.serialNum[i];
            }
            if(scope.chosenItems.unitSelect === "DM2X" && (i===0)){
              reset += scope.chosenItems.serialNum[i];
            }
            else if(isNaN(scope.chosenItems.serialNum[i])){
              reset += scope.chosenItems.serialNum[i];
            };
          };
          scope.chosenItems.serialNum = reset;
        });
        event.preventDefault();
      }
    });
  };
})



.controller('BarcodeController', ['authService', '$scope', '$firebaseArray',  '$firebaseObject', '$timeout', '$http', '$firebaseAuth', '$window', '$document', function (authService, $scope, $firebaseArray, $firebaseObject, $timeout, $http, $firebaseAuth, $window, $document) {

  $scope.isNavCollapsed = false;

  if($window.localStorage.authenticated === 'true'){
    $scope.authenticated = true;
  }
  else{
    $scope.authenticated = false;
  }

  //login function
  $scope.loginWithGoogle = function(runAuth){
    authService.loginWithGoogle()
    .then(function(result){
      $scope.authenticated = true;
      $scope.authenticating = false;
    });
  };

  $scope.logoutWithGoogle = function(){
    authService.logOut();
    $scope.authenticated = false;
  };


  //--------------------------------------------------------------------------------------------------------------------------------------------
  //-----------------controller for barcode generation------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------
    $scope.chosenItems = {
      unitSelect: null,
      serialNum: null
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
      'DM5'
    ];

    //add barcode to array and update local storage-------
    $scope.addBarcode = function(item, serial){
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
          $scope.barcodes.push({unit: item, num: serial})
          localStorage.setItem('barcodes', JSON.stringify($scope.barcodes));

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
            };
          }
          $scope.chosenItems.serialNum = reset;
        }
      }
    }

    //checks that inputted serial number is correctly formatted -------
    $scope.checkSerialNum = function(item, serial){
      var shortBarcode = ['FI', 'HU3', 'MDR3', 'MDR4', 'RMF', 'DM1X', 'DM5'];
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
      else {
        $scope.chosenItems.serialNum = '';
      }
    })

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

    //--------------------------------------------------------------------------------------------------------------------------------------------
    //--------------------controller for check in/out---------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------------------
    $scope.barcodedUnitInfo = firebase.database().ref();
    $scope.barcodedUnits = $firebaseArray($scope.barcodedUnitInfo);

    //initilizations
    $scope.barcodeEntered = false;
    $scope.loaded = false;

    // object with currently read barcode
    $scope.barcodeRead = {
      barcodeNum: ''
    };

    //checks when firebase items are loaded ------
    $scope.barcodedUnits.$loaded().then(function() {
      $scope.loaded = true;
      $scope.loadTable();
      $scope.makeShelfList();
      // console.log($scope.barcodedUnits)
    });

    $scope.$watch('barcodedUnits', function(newValue, oldValue) {
      $scope.loadTable();
    }, true)

    //object keeping track of scanned barcodes
    $scope.pendingBarcodes = {};

    //watches for when a unit is scanned -----------
    $scope.$watch('barcodeRead.barcodeNum', function() {
      if($scope.barcodeRead.barcodeNum){
        //makes subtitles visible
        if($scope.authenticateInput($scope.barcodeRead.barcodeNum)){
          $scope.barcodeEntered = true;

          //make correctly formatted object key
          var simplifiedKey = $scope.simplifyKey($scope.barcodeRead.barcodeNum);
          var ogKey = $scope.barcodeRead.barcodeNum;

          //run check against firebase to get stored status and make new object
          $scope.runCheck(simplifiedKey, ogKey);

          //reset input to empty
          $scope.barcodeRead.barcodeNum = '';
          $scope.playAudio('scanned');
        }
        else{
          $scope.playAudio('alanna');
          // alert('Please enter a real product barcode');
          $scope.barcodeRead.barcodeNum = '';
        }
      }
    });

    $scope.authenticateInput = function(input, src){
      var barcodeLetters = ['FI', 'HU3', 'MDR3', 'MDR4', 'LR2', 'DMF3', 'RMF', 'VF3', 'DM1X', 'DM2X', 'DM5'];
      var parsedItem = input.split(" ");
      var unitType = parsedItem[0];

      var unitTrue = barcodeLetters.indexOf(unitType)>=0;
      var serialLabelTrue = (parsedItem[1] === 's/n');
      if(parsedItem.length < 3){
        alert('Please enter a real product barcode');
        return false;
      }
      else{
        if(parsedItem[2][0]==="L"){
          unitType = 'LR2 Sensor';
        }
        else if(parsedItem[2][0]==="V"){
          unitType = 'LR2 VIU';
        }

        var checkNums = $scope.checkSerialNum(unitType, parsedItem[2]);

        if(unitTrue && serialLabelTrue && checkNums){
          if(src != 'invChecker'){
            $scope.getFirmware(unitType, parsedItem[2]);
          }
          return true;
        }
        else{
          return false;
        }
      }
    };

    $scope.getFirmware = function(unitType, serialNum){
      //prepare unit type for api
      if(unitType === 'FI'){
        apiUnitType = 'F/I';
      }
      else if(unitType === 'MDR3'){
        apiUnitType = 'MDR-3';
      }
      else if(unitType === 'MDR4'){
        apiUnitType = 'MDR-4';
      }
      else if(unitType === 'LR2 Sensor'){
        apiUnitType = 'LR2';
      }
      else if(unitType === 'LR2 VIU'){
        apiUnitType = 'VI';
      }
      else if(unitType === 'VF3'){
        apiUnitType = 'VF3';
      }
      else{
        apiUnitType = unitType;
      }

      //create URL for api call
      var generatedUrl = "https://secure-ocean-3120.herokuapp.com/api/v1/products/search?item=" + apiUnitType + "&serial=" + serialNum;

      if(unitType === 'LR2 Sensor' || unitType === 'LR2 VIU'){
        var constructedName = 'LR2 s/n ' + serialNum;
      }
      else{
        var constructedName = unitType + ' s/n ' + serialNum;
      }
      var pendingBarcodeName = $scope.simplifyKey(constructedName);

      $http.get(generatedUrl)
      .then(function(response){
        //if response is a motor, don't display FW
        if(response.data == null){
          console.log("not in database")
        }

        else if(response.data.item === 'DM1X' || response.data.item === 'DM2X' || response.data.item === 'DM5'){
          var constructedName = unitType + ' s/n ' + serialNum;
          var pendingBarcodeName = $scope.simplifyKey(constructedName);
          $scope.pendingBarcodes[pendingBarcodeName].notMotor = false;
        }

        else{
          if(unitType === 'LR2 Sensor' || unitType === 'LR2 VIU'){
            var constructedName = 'LR2 s/n ' + serialNum;
          }
          else{
            var constructedName = unitType + ' s/n ' + serialNum;
          }
          var pendingBarcodeName = $scope.simplifyKey(constructedName);

          $scope.pendingBarcodes[pendingBarcodeName].latestMainFW = response.data.main_fw_latest ? response.data.main_fw_latest : false;
          $scope.pendingBarcodes[pendingBarcodeName].latestRadioFW = response.data.main_fw_latest ? response.data.main_fw_latest : false;
          $scope.pendingBarcodes[pendingBarcodeName].modsLatest = response.data.mods_latest ? response.data.mods_latest : false ;
          $scope.pendingBarcodes[pendingBarcodeName].fwLink = "https://secure-ocean-3120.herokuapp.com" +  response.data.url;
          $scope.pendingBarcodes[pendingBarcodeName].infoPulled = true;
          $scope.pendingBarcodes[pendingBarcodeName].hasRadio = $scope.includesRadio(unitType);
        }

      });
    }

    //keeps track of number of items in pending barcodes
    $scope.$watch('pendingBarcodes', function(newValue, oldValue) {
      var keys = Object.keys($scope.pendingBarcodes);
      $scope.numPending = keys.length;
    }, true);

    //function determines if unit has a radio or not
    $scope.includesRadio = function(unit){
      var incldRadio = ['FI', 'HU3', 'MDR3', 'MDR4', 'LR2 VIU'];
      if(incldRadio.indexOf(unit)>=0){
        return true;
      }
      else{
        return false;
      }
    }

    //possible statuses: 'unchecked', 'checked out - purchase', 'checked out - other',' on shelf'
    //check status against firebase
    $scope.runCheck = function(item, ogKey){
      //make new object with scanned item
      for(var i = 0; i<$scope.barcodedUnits.length; i++){
        //if item is already stored in database
        if($scope.barcodedUnits[i].$id === item){
          //make new object entry
          $scope.pendingBarcodes[item] = {  name: item,
                                            status: $scope.barcodedUnits[i].status,
                                            barcode: ogKey,
                                            checkedOutClicked: false,
                                            checkInClicked: false,
                                            latestMainFW: false,
                                            latestRadioFW: false,
                                            infoPulled: false,
                                            needMainFW: false,
                                            needRadioFW: false,
                                            notMotor: true
                                          };
          break;
        }
        //if item is getting scanned for the first time
        else{
          $scope.pendingBarcodes[item] = {  name: item,
                                            status: 'unchecked',
                                            barcode: ogKey,
                                            checkedOutClicked: false,
                                            checkInClicked: false,
                                            latestMainFW: false,
                                            latestRadioFW: false,
                                            infoPulled: false,
                                            needMainFW: false,
                                            needRadioFW: false,
                                            notMotor: true
                                          };
        }
      }
    };

    //parses out barcode to correct label
    $scope.simplifyKey = function(item){
      var parsedItem = item.split(" ");
      var unitType = parsedItem[0];
      var unitSerial = parsedItem[2];
      return objName = unitType.toLowerCase() + "_" + unitSerial;
    };

    //plays audio file
    $scope.playAudio = function(sound) {
      if(sound === "checkedIn"){
        var audio = new Audio('audio/checkedIn.wav');
      }
      else if(sound === "checkedOut"){
        var audio = new Audio('audio/checkedOut.wav');
      }
      else if(sound === "removed"){
        var audio = new Audio('audio/removed.wav');
      }
      else if(sound === "scanned"){
        var audio = new Audio('audio/scanned.wav');
      }
      else if(sound === "wrong"){
        var audio = new Audio('audio/noBarcode.wav');
      }
      else if(sound === "removeThemAll"){
        var audio = new Audio('audio/explosion.wav');
      }
      else if (sound === "alanna"){
        var audio = new Audio('audio/alanna.wav');
      }
      audio.play();
    };


  //  -------------button functions to check in/out--------------
    $scope.checkIn = function(unit){
      if(!$scope.authenticated){
        alert('Please login before checking items in or out!')
      }
      else{

        $scope.setFocus();

        $scope.playAudio('checkedIn')
        $scope.pendingBarcodes[unit.name].checkInClicked = true;

        //create object components
        var unitBarcode = unit.barcode;
        var unitSerial = unit.name;
        var unitStatus = 'on shelf';
        var unitType = unitBarcode.split(" ")[0].toLowerCase();

        //set object in firebase
        $scope.barcodedUnitInfo.child(unitSerial).set({
          barcode: unitBarcode,
          serial: unitSerial,
          status: unitStatus,
          unit: unitType,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        })
        .then(function(builds){
          $scope.pendingBarcodes[unit.name].status = "Checked In";
          $scope.$apply();

          $timeout(function(){
            delete $scope.pendingBarcodes[unit.name];
            if(angular.equals($scope.pendingBarcodes, {})){
              $scope.barcodeEntered = false;
            }
          }, 10000)


        });
      }
    }

    $scope.checkOut = function(unit, option){
      if(!$scope.authenticated){
        alert('Please login before checking items in or out!')
      }
      else{
        $scope.setFocus();
        $scope.playAudio('checkedOut')

        //create object
        var unitBarcode = unit.barcode;
        var unitSerial = unit.name;
        var unitStatus = 'checked out - ' + option;
        var unitType = unitBarcode.split(" ")[0].toLowerCase();
        $scope.barcodedUnitInfo.child(unitSerial).set({
          barcode: unitBarcode,
          serial: unitSerial,
          status: unitStatus,
          unit: unitType,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        })
        .then(function(builds){
          $scope.pendingBarcodes[unit.name].status = "Checked Out";
          $scope.pendingBarcodes[unit.name].checkInClicked = true;
          $scope.$apply();
          $timeout(function(){
            delete $scope.pendingBarcodes[unit.name];
            if(angular.equals($scope.pendingBarcodes, {})){
              $scope.barcodeEntered = false;
            }
          }, 10000)
        });
      }
    }

    $scope.remove = function(unit){
      $scope.playAudio('removed')
      $scope.setFocus();
      delete $scope.pendingBarcodes[unit.name];
    };

    //sets focus on input
    $scope.setFocus = function(){
      var input = $window.document.getElementById('scanInput');
      input.focus();
    }

    $scope.removeAllUnits = function(){
      $scope.playAudio('removeThemAll');
      $scope.pendingBarcodes = {};
    }
  //--------------------------------------------------------------------------------------------------------------------------------------------
  //--------------------controller for inventory---------------------------------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------------

  $scope.inventoryList = true;
  $scope.barcodeChecker = {
    barcodeNum: ''
  };
  $scope.unlistedUnits = [];

  $scope.$watch('barcodeChecker.barcodeNum', function(newValue, oldValue) {
    if($scope.barcodeChecker.barcodeNum){
      if($scope.authenticateInput($scope.barcodeChecker.barcodeNum, 'invChecker')){

        $scope.checkInv(newValue);
        $scope.barcodeChecker.barcodeNum = '';
        $scope.playAudio('scanned');
      }
      else{
        $scope.barcodeChecker.barcodeNum = '';
        $scope.playAudio('alanna');
      }
    }
  });
  //not including LR items due to weirdness of labels
  $scope.unitList = ['fi', 'hu3', 'mdr3', 'mdr4', 'dmf3', 'rmf', 'vf3', 'dm1x', 'dm2x', 'dm5'];
  $scope.displayUnitInfo = false;


  // make objects for each unit type
  $scope.loadTable = function(){
    //initialize variables
    $scope.fiInv = [];
    $scope.hu3Inv = [];
    $scope.mdr3Inv = [];
    $scope.mdr4Inv = [];
    $scope.lrInv = [];
    $scope.vouInv = [];
    $scope.dmf3Inv = [];
    $scope.rmfInv = [];
    $scope.vf3Inv = [];
    $scope.dm1xInv = [];
    $scope.dm2xInv = [];
    $scope.dm5Inv = [];

    $scope.allUnits = {
      fi: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      hu3: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      mdr3: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      mdr4: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      lr: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      vou: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      dmf3: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      rmf: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      vf3: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      dm2x: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      dm1x: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      },
      dm5: {
        onShelf : 0,
        outOther: 0,
        outPurchase: 0
      }
    }

    //for each item in barcoded units...
    for(var i in $scope.barcodedUnits){
      //first parse out the item's info
      if($scope.unitList.indexOf($scope.barcodedUnits[i].unit) > -1){
        var particularUnit = $scope.barcodedUnits[i].unit;
        var particularUnitArray = particularUnit + "Inv";

        //add unit to the correct unit array
        $scope[particularUnitArray].push($scope.barcodedUnits[i]);

        //next, update allUnits object with appropriate numbers
        if($scope.barcodedUnits[i].status === "checked out - other"){
          $scope.allUnits[particularUnit].outOther += 1;
        }
        else if($scope.barcodedUnits[i].status === "checked out - purchase"){
          $scope.allUnits[particularUnit].outPurchase += 1;
        }
        else if($scope.barcodedUnits[i].status === "on shelf"){
          $scope.allUnits[particularUnit].onShelf += 1;
        }
      }

      //for LR units, do the same as above
      else if($scope.barcodedUnits[i].unit === 'lr2'){
        var parsedItem = $scope.barcodedUnits[i].barcode.split(" ");
        if(parsedItem[2][0] === 'L'){
          //add unit to the correct unit array
          $scope.lrInv.push($scope.barcodedUnits[i]);
          //next, update allUnits object with appropriate numbers
          if($scope.barcodedUnits[i].status === "checked out - other"){
            $scope.allUnits.lr.outOther += 1;
          }
          else if($scope.barcodedUnits[i].status === "checked out - purchase"){
            $scope.allUnits.lr.outPurchase += 1;
          }
          else if($scope.barcodedUnits[i].status === "on shelf"){
            $scope.allUnits.lr.onShelf += 1;
          }

        }
        else if(parsedItem[2][0] === 'V'){
          //add unit to the correct unit array
          $scope.vouInv.push($scope.barcodedUnits[i]);
          //next, update allUnits object with appropriate numbers
          if($scope.barcodedUnits[i].status === "checked out - other"){
            $scope.allUnits.vou.outOther += 1;
          }
          else if($scope.barcodedUnits[i].status === "checked out - purchase"){
            $scope.allUnits.vou.outPurchase += 1;
          }
          else if($scope.barcodedUnits[i].status === "on shelf"){
            $scope.allUnits.vou.onShelf += 1;
          }
        }
      }
    }
  }

  $scope.getTypeFromBarcode = function(barcode){
    var unitType = '';
    for(var i=0; i<barcode.length; i++){
      if(barcode[i] !== ' '){
        unitType = unitType + barcode[i];
      }
      else{
        return unitType;
      }
    }
  }

  $scope.scrollToElement = function(elem, inSystem){
    var type = $scope.getTypeFromBarcode(elem);
    var id;

    //if unit is a VOU
    if(elem.indexOf('VOU')>-1){
      var id = 'unitType-' + type + ' VIU';
    }
    else if (elem.indexOf('LR2 s/n LR')>-1){
      var id = 'unitType-' + type + ' Sensor';
    }
    else{
      var id = 'unitType-' + type;
    }

    if(!inSystem){
      var someElement = angular.element(document.getElementById('notInSystem'));
      $document.scrollToElementAnimated(someElement, 150);
    }
    else{
      var someElement = angular.element(document.getElementById(id));
      $document.scrollToElementAnimated(someElement, 150);
    }

  }

  $scope.revealStoredUnits = function(unitType){
    $scope.displayUnitInfo = true;
    $scope.revealedUnit = unitType;

    var unitArray = unitType + 'Inv';
    $scope.displayInformation = $scope[unitArray];
  }


  $scope.makeShelfList = function(){
    $scope.shelfUnits = [];
    var listCounter = 0;

    for(var unit in $scope.barcodedUnits){
      if($scope.barcodedUnits[unit].status === "on shelf"){
        // var newObj = {};
        var newObj =
          {checked: false,
            barcode: $scope.barcodedUnits[unit].barcode
          };
        $scope.shelfUnits.push(newObj);
      }
      listCounter++;
      if(listCounter === $scope.barcodedUnits.length){
        // console.log($scope.shelfUnits);
      }
    }
  }

  $scope.categorySort = function(unitType) {

    return function(unit) {
      var barcode = unit.barcode;
      if(unitType === "LR2 Sensor"){
        if(barcode.includes("s/n LR")){
          return unit;
        }
      }
      else if(unitType === "LR2 VIU"){
        if(barcode.includes("s/n VOU")){
          return unit;
        }
      }
      else if(barcode.includes(unitType)){
        return unit;
      }
      else{
        return false;
      }
   }
  };

  $scope.checkInv = function(barcode){
    var inArray = false;
    for(var i in $scope.shelfUnits){
      if($scope.shelfUnits[i].barcode === barcode){
        $scope.shelfUnits[i].status = true;
        inArray = true;
      }
    }

    if(!inArray){
      if($scope.unlistedUnits.indexOf(barcode)===-1){
        $scope.unlistedUnits.push(barcode);
      }
      $scope.scrollToElement(barcode, false);
    }
    else{
      $scope.scrollToElement(barcode, true);
    }
  }


  $scope.sortType     = 'name'; // set the default sort type
  $scope.sortReverse  = false;  // set the default sort order
  $scope.searchUnits   = '';     // set the default search/filter term


}])
//end of controller

//----------------------------------------------------------------------------------------------------------
//--------------------------------------printed barcodes controller-----------------------------------------
//----------------------------------------------------------------------------------------------------------

.controller('PrintController', ['$scope', function ($scope) {
  $scope.allBarcodes = JSON.parse(localStorage.getItem('barcodes'));
  //barcode sizes
  var vm = this;
  vm.options = {
      width: 2,
      height: 80,
      quite: 10,
      displayValue: true,
      font: "monospace",
      textAlign: "center",
      fontSize: 12,
      backgroundColor: "",
      lineColor: "#000"
  };

}])
