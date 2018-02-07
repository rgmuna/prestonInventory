barcodeApp.controller('LoanerController', ['authService', '$scope', '$firebaseArray',  '$firebaseObject', '$timeout', '$http', '$firebaseAuth', '$window', '$filter', function (authService, $scope, $firebaseArray, $firebaseObject, $timeout, $http, $firebaseAuth, $window, $filter) {

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

  $scope.customerArray = ['reset'];

  //firebase loaner load
  $scope.loanerInfo = firebase.database().ref().child('loaners');
  $scope.loaners = $firebaseObject($scope.loanerInfo);
  $scope.loanerArray = $firebaseArray($scope.loanerInfo);
  $scope.showUnitList = true;

  $scope.loaners.$loaded().then(function() {
    $scope.loaded = true;
    $scope.fixStatuses();
    $scope.createCustArray();
    $scope.populateCustomers();
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
                $scope.getFirmware($scope.pendingLoaners[numbers], 'checkInOut');
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
  $scope.getFirmware = function(unit, source){
    var unitType = unit.unit;
    var serialNum = unit.serialNum;
    var barcode = unit.unitBarcode;

    if(source!=='checkInOut'){
      var unitIndex = $scope.loanerArray.indexOf(unit);

      $scope.loanerArray[unitIndex].firmware = 'pending';
      $scope.loanerArray[unitIndex].mods = 'pending';
      $scope.loanerArray[unitIndex].radio = 'pending';
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
        $scope.invApiResponse(unit, response);
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

  $scope.invApiResponse = function(unit, response){

    //get index of unit in loaner array
    var unitIndex = $scope.loanerArray.indexOf(unit);

    var unitType = $scope.loanerArray[unitIndex].unit;

    if(response.data === null){
      if(unitType === 'DM1X' || unitType === 'DM2X' || unitType === 'DM2' || unitType === 'DM5' || unitType === 'DM4' || unitType === 'DM4X'){
      }
      else{
        alert("Unit not in internal database. Enter into database then redo check in of unit.");
      }
      $scope.loanerArray[unitIndex].firmware = 'NA';
      $scope.loanerArray[unitIndex].mods = 'NA';
      $scope.loanerArray[unitIndex].radio = 'NA';
    }
    else{
      var noRadio = ["LR2", "DMF3", "DMF2"];
      var all = ["FI", "HU3", "MDR3", "MDR2", "MDR4", "VIU", "RMF", "VLC"];
      var hasRadio = (all.indexOf(unitType)!==-1);

      if(!hasRadio){
        $scope.loanerArray[unitIndex].radio = "NA";
        hasRadio = false;
      }
      //else if unit does have a radio
      else{
        $scope.loanerArray[unitIndex].radio = response.data.radio_fw_latest ? response.data.radio_fw_latest : false;
        hasRadio = $scope.loanerArray[unitIndex].radio;
      }
      //update firmware and mods info for unit
      $scope.loanerArray[unitIndex].firmware = response.data.main_fw_latest ? response.data.main_fw_latest : false;
      $scope.loanerArray[unitIndex].mods = response.data.mods_latest ? response.data.mods_latest : false;
    }
  };


// status: 'checked out' | 'needs QA' | 'ready'
  $scope.setStatus = function(unit, hasRadio){
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

  $scope.custImport = function(unit, custInfo){
    var singleLoaner = $scope.pendingLoaners[unit.unitBarcode].customerInfo;

    if(custInfo === 'reset'){
      singleLoaner.name = '';
      singleLoaner.phoneNum = '';
      singleLoaner.email = '';
      singleLoaner.repairNum = '';
      singleLoaner.shippingAddress = '';
      singleLoaner.notes = '';
    }

    if(custInfo.name){
      singleLoaner.name = custInfo.name;
    }
    if(custInfo.phoneNum){
      singleLoaner.phoneNum = custInfo.phoneNum;
    }
    if(custInfo.email){
      singleLoaner.email = custInfo.email;
    }
    if(custInfo.repairNum){
      singleLoaner.repairNum = custInfo.repairNum;
    }
    if(custInfo.shippingAddress){
      singleLoaner.shippingAddress = custInfo.shippingAddress;
    }
    if(custInfo.notes){
      singleLoaner.notes = custInfo.notes;
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

  $scope.listSelection = function(type){
    if(type==='unit'){
      $scope.showUnitList = true;
    }
    else if(type==='customer'){
      $scope.showUnitList = false;
    }
  }

  $scope.createCustArray = function(){
    //for each item in loaner array
    for(var item in $scope.loanerArray){
      //find units that are checked out
      if($scope.loanerArray[item].status === 'checked out'){
        //if object is NOT already in customer array
        if($scope.objNotInArray($scope.loanerArray[item].customerInfo, $scope.customerArray)){
          //add customer to customer array
          $scope.customerArray.push($scope.loanerArray[item].customerInfo);
        }
      }
    }
  }

  //checks if object is NOT in an array by obj.name
  $scope.objNotInArray = function(obj, arr){
    for(var i in arr){
      if(obj.name === arr[i].name){
        return false;
      }
    }
    return true;
  }


  $scope.populateCustomers = function(){
    //instantiate customer object where items will be stored
    $scope.customerObj = {};

    for(var loaner in $scope.loanerArray){

      //particular item
      var loanerItem = $scope.loanerArray[loaner];

      //if item has customer info
      if(loanerItem.customerInfo){

        //if customer info has a name (i.e. is populated)
        if(loanerItem.customerInfo.name){
          //remove all symbols and spaces
          var formatName = loanerItem.customerInfo.name.replace(/[^a-zA-Z0-9]/g, '');

          //if customer is in the customer obj
          if($scope.customerObj.hasOwnProperty(formatName)){
            $scope.customerObj[formatName].units[loanerItem.unitBarcode] =
            { unitBarcode: loanerItem.unitBarcode,
              firmware: loanerItem.firmware,
              location: loanerItem.location,
              mods: loanerItem.mods,
              notes: loanerItem.notes,
              radio: loanerItem.radio,
              serialNum: loanerItem.serialNum,
              status: loanerItem.status,
              timeStamp: loanerItem.timeStamp,
              unit: loanerItem.unit,
            };
            $scope.customerObj[formatName].numUnits++;
          }
          else{
            //create new item in customer object w/ customer info and units
            $scope.customerObj[formatName] = { customerInfo: "", units: {}, numUnits: 1 };
            //populate customer info
            $scope.customerObj[formatName].customerInfo = loanerItem.customerInfo;
            //populate units
            $scope.customerObj[formatName].units[loanerItem.unitBarcode] =
            { unitBarcode: loanerItem.unitBarcode,
              firmware: loanerItem.firmware,
              location: loanerItem.location,
              mods: loanerItem.mods,
              notes: loanerItem.notes,
              radio: loanerItem.radio,
              serialNum: loanerItem.serialNum,
              status: loanerItem.status,
              timeStamp: loanerItem.timestamp,
              unit: loanerItem.unit,
            };
          }
        }
      }
    }
  }


  $scope.editInfo = function(value){

  }

  $scope.generatePage = function(value){
    //doc.text(width, height, text)
    //right align: doc.text(200, 110, 'And some more', null, null, 'right');
    //center align: doc.text(105, 10, 'This is centred text.', null, null, 'center');

    var imgData = "data:image/png;base64,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";

    var doc = new jsPDF('p', 'mm', 'letter' );

    doc.setDrawColor(35,50,55);
    doc.setLineWidth(.5);
    doc.line(0, 10, 250, 10); // horizontal line

    doc.addImage(imgData, 'JPEG', 5, 6, 18, 18);

    doc.setFont("helvetica");
    doc.setTextColor(130);
    doc.setFontSize(14);
    doc.text(25, 15, 'Preston Cinema Systems');
    doc.text(25, 21, '(310) 453-1852');
    doc.text(208, 15, '1659 11th St, Suite 100', null, null, 'right');
    doc.text(208, 21, 'Santa Monica, CA 90404', null, null, 'right');



    // doc.setTextColor(35,50,55);
    // doc.setFontType("bold");
    // doc.text(213, 9, 'Equipment Loan', null, null, 'right');

    doc.setTextColor(35,50,55);
    doc.setFontSize(20);
    doc.setFontType("bold");
    doc.text(105, 50, 'Equipment Loan', null, null, 'center');



    doc.save('test.pdf');
  }


}]);
