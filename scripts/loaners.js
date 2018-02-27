barcodeApp.controller('LoanerController', ['authService', '$scope', '$firebaseArray',  '$firebaseObject', '$timeout', '$http', '$firebaseAuth', '$window', '$filter', function (authService, $scope, $firebaseArray, $firebaseObject, $timeout, $http, $firebaseAuth, $window, $filter) {

  $scope.counterTest = 0;

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
            // if item is stored in loaner database
            console.log($scope.loaners[numbers])
            if($scope.loaners[numbers]){
              // create loaner in pending obj
              $scope.pendingLoaners[numbers] = deepObjCopy($scope.loaners[numbers]);
              // $scope.pendingLoaners[numbers] = $scope.loaners[numbers];
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


  var deepObjCopy = function(obj){
    var secondObj = {};
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
          secondObj[prop] = obj[prop];
      }
    }
    return secondObj;
  }


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


// status: 'checked out' | 'needs QA' | 'ready'
  $scope.setStatus = function(unit, hasRadio){
    // $scope.counterTest++;

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
        // console.log()
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
  $scope.editing = false;
  $scope.saving = false;
  $scope.saved = false;

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
      if(loanerItem.customerInfo && loanerItem.status === "checked out"){

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


  $scope.editInfo = function(value, status){
    var oldValue = value.customerInfo;

    if(status==='edit'){
      $scope.editValues = {
        name: oldValue.name,
        email: oldValue.email,
        phoneNum: oldValue.phoneNum,
        repairNum: oldValue.repairNum,
        shippingAddress: oldValue.shippingAddress,
        notes: oldValue.notes
      }
      $scope.editing = true;
    }
    else if(status==='cancel'){
      $scope.editing = false;
    }
    else if (status==='save'){
      $scope.saving = true;
      $scope.editing = false;

      for(var i in  value.units){
        var barcode = value.units[i].unitBarcode;
        $scope.loanerInfo.child(barcode).child('customerInfo').set(
          $scope.editValues
        )
        .then(function(builds){

          value.customerInfo = $scope.editValues;

          $timeout(function(){
            $scope.saved = true
            $scope.saving = false;
          }, 500);
          $timeout(function(){
            $scope.saved = false;
          }, 2500);
        })
        .catch(function(error){
          alert(error + " try saving again");
          $scope.editing = true;
        });
      }
    }
  }



  $scope.generatePage = function(value){
    var date = new Date();
    var formattedDate = $filter('date')(date, "MMM d, y");
    var customerInfo = value.customerInfo;
    var columns = [
      {title: 'Barcode', dataKey: 'barcode'},
      {title: 's/n', dataKey: 'serial'},
      {title: 'Unit', dataKey: 'unit'},
      {title: 'Unit Notes', dataKey: 'notes'},
    ];
    var rows = [];

    for(var unit in value.units){
      var newUnit = value.units[unit];
      var newRow = {barcode: newUnit.unitBarcode, serial: newUnit.serialNum, unit: newUnit.unit, notes: newUnit.notes}
      rows.push(newRow);
    }

    var doc = new jsPDF('p', 'pt', 'letter' );
    doc.setDrawColor(220,220,220);
    doc.setLineWidth(.25);
    doc.line(30, 75, 590, 75);
    doc.setFont("helvetica");
    doc.setTextColor(35,50,55);
    doc.setFontSize(20);
    doc.setFontType("bold");
    doc.text(30, 67, 'Equipment Loan');
    doc.setFontSize(10);
    doc.text(590, 68, formattedDate, null, null, 'right')
    doc.setTextColor(130);
    doc.setFontSize(10);
    doc.setFontType("normal")
    doc.text(30, 90, 'Preston Cinema Systems');
    doc.text(30, 105, '(310) 453-1852');
    doc.text(590, 90, '1659 11th St, Suite 100', null, null, 'right');
    doc.text(590, 105, 'Santa Monica, CA 90404', null, null, 'right');
    doc.setTextColor(35,50,55);
    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text(30, 220, 'Customer Info');
    doc.text(30, 340, 'Units');
    doc.setFontSize(10);
    doc.text(30, 245, 'Name: ');
    doc.text(30, 275, 'Shipping: ');
    doc.setFontType('normal');
    doc.text(90, 245, customerInfo.name);
    doc.text(90, 275, customerInfo.shippingAddress);
    doc.setDrawColor(35,50,55);
    doc.setLineWidth(2);
    doc.line(30, 225, 590, 225);
    doc.line(30, 345, 590, 345);
    doc.autoTable(columns, rows, {
        theme: 'striped',
        styles: {},
        columnStyles: {},
        margin: {top: 360},
        headerStyles: {
          fillColor: [220,220,220],
          textColor: 20
        }
    });

    doc.text(30, 750, 'Prepared By:________________________________');
    doc.text(300, 750, 'Received By:________________________________');
    doc.save('test.pdf');
  }


}]);
