barcodeApp.controller('Inv_CheckInOut_Ctrl', [
  'authService',
  '$scope',
  '$firebaseArray',
  '$firebaseObject',
  '$timeout',
  '$http',
  '$firebaseAuth',
  '$window',
  '$document',
  '$filter',
  function (authService, $scope, $firebaseArray, $firebaseObject, $timeout, $http, $firebaseAuth, $window, $document, $filter) {

    //------------- Oauth -------------

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

    //------------- Import Firebase Information -------------

    //product invnetory from Firebase
    $scope.barcodedUnitInfo = firebase.database().ref().child('inventory');
    $scope.barcodedUnits = $firebaseArray($scope.barcodedUnitInfo);

    //cable invnetory from Firebase
    $scope.barcodedCableInfo = firebase.database().ref().child('cableInventory');
    $scope.barcodedCables = $firebaseArray($scope.barcodedCableInfo);

    //accessory invnetory from Firebase
    $scope.barcodedAccessoryInfo = firebase.database().ref().child('accessoryInventory');
    $scope.barcodedAccessories = $firebaseArray($scope.barcodedAccessoryInfo);


    //------------- For Scanning Items -------------

    //initilizations
    $scope.barcodeEntered = false;
    $scope.loaded = false;

    // object with currently read barcode
    $scope.barcodeRead = {
      barcodeNum: ''
    };

    //checks when firebase items are loaded
    $scope.barcodedUnits.$loaded().then(function() {
      $scope.loaded = true;
    });

    //object keeping track of scanned barcodes
    $scope.pendingBarcodes = {};

    //watches for when a unit is scanned
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
          $scope.barcodeRead.barcodeNum = '';
        }
      }
    });

    //------------- Unit Authentication -------------

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
    }

    $scope.authenticateInput = function(input, src){
      var parsedItem = input.split(" ");

      //accessory or cable
      if(parsedItem.length === 1){
        var identifier = parsedItem[0].toUpperCase();

        //if cable...
        if(identifier === "C"){
          //look in firebase array

          //if you find this cable in the firebase array, prepare to add/subtract from in stock

          //if you do NOT find this cable in the firebase array, show "add new cable" 
        }

      }

      //product
      else if (parsedItem.length === 3) {
        var barcodeLetters = ['FI', 'HU3', 'MDR3', 'MDR4', 'LR2', 'DMF3', 'RMF', 'VF3', 'DM1X', 'DM2X', 'DM5', 'BM'];
        var unitType = parsedItem[0];
        var unitTrue = barcodeLetters.indexOf(unitType)>=0;
        var serialLabelTrue = (parsedItem[1] === 's/n');

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
      //not a real barcode
      else {
        alert('Please enter a real product barcode');
        return false;
      }
    };

    //------------- Get firmware from API (units only)-------------

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
      else if(unitType === 'BM'){
        apiUnitType = 'Updater';
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
          $scope.pendingBarcodes[pendingBarcodeName].notes = response.data.notes;
          console.log(response);

        }

        else{
          console.log(response);
          if(unitType === 'LR2 Sensor' || unitType === 'LR2 VIU'){
            var constructedName = 'LR2 s/n ' + serialNum;
          }
          else{
            var constructedName = unitType + ' s/n ' + serialNum;
          }
          var pendingBarcodeName = $scope.simplifyKey(constructedName);

          $scope.pendingBarcodes[pendingBarcodeName].latestMainFW = response.data.main_fw_latest ? response.data.main_fw_latest : false;
          $scope.pendingBarcodes[pendingBarcodeName].latestRadioFW = response.data.radio_fw_latest ? response.data.radio_fw_latest : false;
          $scope.pendingBarcodes[pendingBarcodeName].modsLatest = response.data.mods_latest ? response.data.mods_latest : false ;
          $scope.pendingBarcodes[pendingBarcodeName].fwLink = "https://secure-ocean-3120.herokuapp.com" +  response.data.url;
          $scope.pendingBarcodes[pendingBarcodeName].infoPulled = true;
          $scope.pendingBarcodes[pendingBarcodeName].notes = response.data.notes;
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
        var audio = new Audio('../audio/checkedIn.wav');
      }
      else if(sound === "checkedOut"){
        var audio = new Audio('../audio/checkedOut.wav');
      }
      else if(sound === "removed"){
        var audio = new Audio('../audio/removed.wav');
      }
      else if(sound === "scanned"){
        var audio = new Audio('../audio/scanned.wav');
      }
      else if(sound === "wrong"){
        var audio = new Audio('../audio/noBarcode.wav');
      }
      else if(sound === "removeThemAll"){
        var audio = new Audio('../audio/explosion.wav');
      }
      else if (sound === "alanna"){
        var audio = new Audio('../audio/alanna.wav');
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
}]);