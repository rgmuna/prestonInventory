barcodeApp.controller('LoanerController', ['authService', '$scope', '$firebaseArray',  '$firebaseObject', '$timeout', '$http', '$firebaseAuth', '$window', function (authService, $scope, $firebaseArray, $firebaseObject, $timeout, $http, $firebaseAuth, $window) {

  //authentication stuff-------------
  if($window.localStorage.authenticated === 'true'){
    $scope.authenticated = true;
  }
  else{
    $scope.authenticated = false;
  }

  //login function
  $scope.loginWithGoogle = function(runAuth){
    $scope.authenticating = true;
    authService.loginWithGoogle()
    .then(function(result){
      $scope.authenticated = true;
      $scope.authenticating = false;
    });
  };

  //logout function
  $scope.logoutWithGoogle = function(){
    authService.logOut();
    $scope.authenticated = false;
  };
  //-------------------------------

  //firebase loaner load
  $scope.loanerInfo = firebase.database().ref().child('loaners');
  $scope.loaners = $firebaseObject($scope.loanerInfo);
  $scope.loanerArray = $firebaseArray($scope.loanerInfo);

  $scope.loaners.$loaded().then(function() {
    $scope.loaded = true;
    $scope.fixStatuses();
  });

  //scanned input
  $scope.loanerScan = {
    barcodeNum: "",
    test: ''
  };

  //loaner products
  $scope.loanerProducts = [
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
    'VLC'
  ];

  //keeps tracked of scanned inputs
  $scope.pendingLoaners = {};

//-------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------MAIN WATCHER FOR SCANNED INPUT-----------------------------------------------------------------------------------
  $scope.$watch('loanerScan.barcodeNum', function() {
    if($scope.loanerScan.barcodeNum.length<7){
    }
    else{
      if($scope.authenticated){
        if($scope.loanerScan.barcodeNum){
          //if barcode is correct format
          if($scope.authenticateInput($scope.loanerScan.barcodeNum)){
            var barcode = $scope.loanerScan.barcodeNum;
            var letters = barcode.substring(0,3);
            var numbers = Number(barcode.substring(3));

            //if item is stored in loaner database
            if($scope.loaners[numbers]){
              // create loaner in pending obj
              $scope.pendingLoaners[numbers] = $scope.loaners[numbers];
              //if unit is motor, hide fw stuff
              if($scope.isMotor($scope.pendingLoaners[numbers].unit)){
                $scope.pendingLoaners[numbers].firmware = "NA";
                $scope.pendingLoaners[numbers].radio = "NA";
                $scope.pendingLoaners[numbers].mods = "NA";
                $scope.setStatus($scope.pendingLoaners[numbers], false);
              }
              //for all non-motors, properly sort out firmware
              else{
                $scope.getFirmware('', $scope.pendingLoaners[numbers], 'checkInOut');
              }
            }
            //if item isn't in loaner database
            else{
              var newLoaner = $scope.createLoaner(numbers);
            }
            //reset input to empty
            $scope.loanerScan.barcodeNum = '';
          }
          else{
            alert('Please enter a real loaner barcode');
            $scope.loanerScan.barcodeNum = '';
          }
        }
      }
      else{
        if($scope.loanerScan.barcodeNum){
          alert("Please login first");
          $scope.loanerScan.barcodeNum = '';
        }
      }
    }
  });
//--------------------------MAIN WATCHER FOR SCANNED INPUT---------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------



// FUNCTIONS FOR NEW UNITS===============================================================================================================
  //makes sure barcode is correct
  $scope.authenticateInput = function(input){
    if(input.length != 7){
      return false;
    }
    else{
      var letters = input.substring(0,3).toUpperCase();
      var numbers = input.substring(3);

      //if starting letters aren't PCS
      if(letters != 'PCS'){
        return false;
      }
      //if there aren't 4 numbers or the 4 characters aren't a number
      if((numbers.length != 4) || (isNaN(Number(numbers)))){
        return false;
      }
      //else number should be correct
      else{
        return true;
      }
    }
  }

  //creates new loaner if one doesn't exist in database
  $scope.createLoaner = function(newBarcode){
    var newItem = {
      status: '',
      unitBarcode: newBarcode,
      unit: '',
      serialNum: '',
      location: 'not in database',
      firmware: '',
      radio: '',
      mods: '',
      notes: '',
      valid: false,
      showCustomer: false,
      customerInfo: {
        name: '',
        email: '',
        phoneNum: '',
        date: '',
        repairNum: '',
        notes: '',
        shippingAddress: ''
      }
    }
    $scope.pendingLoaners[newBarcode] = newItem;
  }

  //populates serial number field w/ right prefix
  $scope.unitSelect = function(unit, type){
    if(type === 'DMF3'){
      $scope.pendingLoaners[unit.unitBarcode].serialNum = 'D3-';
    }
    else if(type === 'LR2'){
      $scope.pendingLoaners[unit.unitBarcode].serialNum = 'LR';
    }
    else if(type === 'VIU'){
      $scope.pendingLoaners[unit.unitBarcode].serialNum = 'VOU';
    }
    else if(type === 'VF3'){
      $scope.pendingLoaners[unit.unitBarcode].serialNum = 'MF';
    }
    else if(type === 'DM2X'){
      $scope.pendingLoaners[unit.unitBarcode].serialNum = '2X';
    }
    else if(type === "DMF2"){
      $scope.pendingLoaners[unit.unitBarcode].serialNum = 'D';
    }
    else if(type === "VLC"){
      $scope.pendingLoaners[unit.unitBarcode].serialNum = 'V';
    }
    else {
      $scope.pendingLoaners[unit.unitBarcode].serialNum = '';
    }
    $scope.setFocus(unit.unitBarcode);
  }

  //function for setting focus on particular serial number entry
  $scope.setFocus = function(id){
    var input = $window.document.getElementById(id);
    input.focus();
  }

  //checks if serial number if valid
  $scope.serialNumCheck = function(unit){
    var validSerial = $scope.checkSerialNum(unit.unit, unit.serialNum);
    $scope.pendingLoaners[unit.unitBarcode].valid = validSerial;
  }

  //submits serial nubmer to database
  $scope.submitToDatabase = function(unit, newStatus){
    if(newStatus === 'makeUnit'){
      unit.location = "in house";
      unit.status = "ready";
    }
    else if(newStatus === 'checkBackIn'){
      unit.location = "in house";
      unit.status = "needs QA"
    }
    else if(newStatus === 'checkIn'){
      unit.location = "in house";
      unit.status = "ready";
      unit.customerInfo = {
        name: '',
        email: '',
        phoneNum: '',
        date: '',
        repairNum: '',
        notes: '',
        shippingAddress: ''
      }
    }
    else if(newStatus === 'checkOut'){
      unit.location = "checked out";
      unit.status = "checked out";
    }
    unit.timestamp = firebase.database.ServerValue.TIMESTAMP;
    $scope.loanerInfo.child(unit.unitBarcode).set(
      unit
    )
    .then(function(builds){
      $scope.pendingLoaners[unit.unitBarcode].status = "Submitted";
      $timeout(function(){
        // $scope.$apply();
        delete $scope.pendingLoaners[unit.unitBarcode];
        if(angular.equals($scope.pendingBarcodes, {})){
        }
      }, 1300)
    });
  }

  //serial number check
  $scope.checkSerialNum = function(item, serial){
    var shortBarcode = ['FI', 'HU3', 'MDR3', 'MDR4', 'RMF', 'DM1X', 'DM5', 'DM2', 'DM4X', 'MDR2'];
    //if the item is one of the short barcode items
    if(shortBarcode.indexOf(item) >= 0){
      if(!isNaN(serial) && (serial.length === 4) && (item != 'DM5')){
        return true;
      }
      else if(!isNaN(serial) && (serial.length === 5) && (item==='DM5')){
        return true;
      }
      else{
        return false;
      }
    }
    //if item is LR2 sensor
    else if(item==='LR2'){
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
        return false;
      }
    }
    else if(item==='VIU'){
      var serialLetters = serial.substring(0, 3);
      var numberLength = serial.substring(3).length;
      var serialNumbers = Number(serial.substring(3));
      var lettersCorrect = (serialLetters === 'VOU');
      var numbersCorrect = (serialNumbers && numberLength===4);
      if(lettersCorrect && numbersCorrect){
        return true;
      }
      else{
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
        return false;
      }
    }
    else if(item==='DMF2'){
      var serialLetters = serial.substring(0, 1);
      var numberLength = serial.substring(1).length;
      var serialNumbers = Number(serial.substring(1));
      var lettersCorrect = (serialLetters === 'D');
      var numbersCorrect = (serialNumbers && numberLength===5);
      if(lettersCorrect && numbersCorrect){
        return true;
      }
      else{
        return false;
      }
    }
    else if(item==='VLC'){
      var serialLetters = serial.substring(0, 1);
      var numberLength = serial.substring(1).length;
      var serialNumbers = Number(serial.substring(1));
      var lettersCorrect = (serialLetters === 'V');
      var numbersCorrect = (serialNumbers && numberLength===4);
      if(lettersCorrect && numbersCorrect){
        return true;
      }
      else{
        return false;
      }
    }
  }

  // FUNCTIONS FOR NEW UNITS===============================================================================================================


  //removes item from list of pending loaner scans
  $scope.removeItem = function(unit){
    delete $scope.pendingLoaners[unit.unitBarcode];
  }

  //checks if unit is motor
  $scope.isMotor = function(unitType){
    var motors = ["DM2X", "DM1X", "DM1", "DM2", "DM5", "DM4X"];
    if(motors.indexOf(unitType) !== -1 ){
      return true;
    }
    else{
      return false;
    }
  }

  //get firmware from API
    //key = key of loaner array (used only for inventory purposes, not check in/out)
    //unit = particular unit object
    //source = where the call was made (check in/out vs inventory)
  $scope.getFirmware = function(key, unit, source){
    var unitType = unit.unit;
    var serialNum = unit.serialNum;
    var barcode = unit.unitBarcode;

    if(source!=='checkInOut'){
      $scope.loanerArray[key].firmware = 'pending';
      $scope.loanerArray[key].mods = 'pending';
      $scope.loanerArray[key].radio = 'pending';
    }

    //prepare unit type for api
    if(unitType === 'FI'){
      apiUnitType = 'F/I';
    }
    else if(unitType === 'MDR3'){
      apiUnitType = 'MDR-3';
    }
    else if(unitType === 'MDR2'){
      apiUnitType = 'MDR-2';
    }
    else if(unitType === 'MDR4'){
      apiUnitType = 'MDR-4';
    }
    else if(unitType === 'LR2'){
      apiUnitType = 'LR2';
    }
    else if(unitType === 'VIU'){
      apiUnitType = 'VI';
    }
    else if(unitType === 'VF3'){
      apiUnitType = 'VF3';
    }
    else{
      apiUnitType = unitType;
    }

    // create URL for api call
    var generatedUrl = "https://secure-ocean-3120.herokuapp.com/api/v1/products/search?item=" + apiUnitType + "&serial=" + serialNum;
    $http.get(generatedUrl)
    .then(function(response){
      //if getting API info for the check in/out page
      if(source==='checkInOut'){
        $scope.checkApiResponse(unit, response);
      }
      //if getting API info for the inventory page
      else{
        $scope.invApiResponse(key, unit, response);
      }
    });
  }

  $scope.checkApiResponse = function(unit, response){
    var unitType = unit.unit;
    //if response is a motor, don't display FW
    if(response.data == null){
      alert("Unit not in internal database. Enter into database then redo check in of unit.");
      delete $scope.pendingLoaners[unit.unitBarcode];
    }
    else{
      var noRadio = ["LR2", "DMF3", "DMF2"];
      var all = ["FI", "HU3", "MDR3", "MDR2", "MDR4", "VIU", "RMF", "VLC"];
      var hasRadio = (all.indexOf(unitType)!==-1);

      //if unit doesn't have a radio
      if(!hasRadio){
        $scope.pendingLoaners[unit.unitBarcode].radio = "NA";
        hasRadio = false;
      }
      //else if unit does have a radio
      else{
        $scope.pendingLoaners[unit.unitBarcode].radio = response.data.radio_fw_latest ? response.data.radio_fw_latest : false;
        hasRadio = $scope.pendingLoaners[unit.unitBarcode].radio;
      }
      //update firmware and mods info for unit
      $scope.pendingLoaners[unit.unitBarcode].firmware = response.data.main_fw_latest ? response.data.main_fw_latest : false;
      $scope.pendingLoaners[unit.unitBarcode].mods = response.data.mods_latest ? response.data.mods_latest : false;
      $scope.setStatus(unit, hasRadio);
    }
  };

  $scope.invApiResponse = function(key, value, response){
    var unitType = $scope.loanerArray[key].unit;
    if(response.data === null){
      if(unitType === 'DM1X' || unitType === 'DM2X' || unitType === 'DM2' || unitType === 'DM5' || unitType === 'DM4' || unitType === 'DM4X'){
      }
      else{
        alert("Unit not in internal database. Enter into database then redo check in of unit.");
      }
      $scope.loanerArray[key].firmware = 'NA';
      $scope.loanerArray[key].mods = 'NA';
      $scope.loanerArray[key].radio = 'NA';
    }
    else{
      var noRadio = ["LR2", "DMF3", "DMF2"];
      var all = ["FI", "HU3", "MDR3", "MDR2", "MDR4", "VIU", "RMF", "VLC"];
      var hasRadio = (all.indexOf(unitType)!==-1);

      if(!hasRadio){
        $scope.loanerArray[key].radio = "NA";
        hasRadio = false;
      }
      //else if unit does have a radio
      else{
        $scope.loanerArray[key].radio = response.data.radio_fw_latest ? response.data.radio_fw_latest : false;
        hasRadio = $scope.loanerArray[key].radio;
      }
      //update firmware and mods info for unit
      $scope.loanerArray[key].firmware = response.data.main_fw_latest ? response.data.main_fw_latest : false;
      $scope.loanerArray[key].mods = response.data.mods_latest ? response.data.mods_latest : false;
      // $scope.setStatus(unit, hasRadio);
    }
  };


// status: 'checked out' | 'needs QA' | 'ready'
  $scope.setStatus = function(unit, hasRadio){
    // console.log($scope.pendingLoaners);
    // console.log(hasRadio)
    var unitStatus = unit.status;
    var updateStatus = "";

    if(unitStatus === "ready"){
      //if unit is a motor
      if($scope.isMotor(unit.unit)){
        $scope.pendingLoaners[unit.unitBarcode].status = "Ready to loan";
      }
      //if unit has a radio and is up to date or doesn't have a radio
      else if(((hasRadio && unit.radio) || !hasRadio) && unit.firmware && unit.mods){
        $scope.pendingLoaners[unit.unitBarcode].status = "Ready to loan";
      }
      else{
        $scope.pendingLoaners[unit.unitBarcode].status = "Needs updates";
      }
    }
    else if (unitStatus === 'needs QA'){
      if($scope.isMotor(unit.unit)){
        $scope.pendingLoaners[unit.unitBarcode].status = "Needs QA";
      }
      else if(((hasRadio && unit.radio) || !hasRadio) && unit.firmware && unit.mods){
        $scope.pendingLoaners[unit.unitBarcode].status = "Needs QA";
      }
      else{
        $scope.pendingLoaners[unit.unitBarcode].status = "Needs updates & QA";
      }
    }
    else if (unitStatus === 'checked Out'){
      $scope.pendingLoaners[unit.unitBarcode].status = "Ready to be checked in";
    }
  }

//==============================================================================================================================================
//
//                                          Loaner Inventory
//
//==============================================================================================================================================

  $scope.loanerSearch = '';
  $scope.filterVariables = {
    unitType: '',
    status: ''
  }

  $scope.loanerStatuses = ['in house', 'needs QA', 'checked out'];

  $scope.removeFilter = function(item, selection){
    if(item === "unitFilter"){
      if(!selection){
        $scope.filterVariables.unitType = "";
      }
    }
    else if (item === "statusFilter"){
      if(!selection){
        $scope.filterVariables.status = "";
      }
    }
  }

  $scope.fixStatuses = function(){
    for(var item in $scope.loanerArray){
      if($scope.loanerArray[item].status === 'ready'){
        $scope.loanerArray[item].status = 'in house';
      }
    }
  }


}]);
