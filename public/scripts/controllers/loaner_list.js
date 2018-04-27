barcodeApp.controller('Loaner_List_Ctrl', [
  'authService',
  '$scope',
  '$firebaseArray',
  '$firebaseObject',
  '$timeout',
  '$http',
  '$firebaseAuth',
  '$window',
  '$filter',
  function (authService, $scope, $firebaseArray, $firebaseObject, $timeout, $http, $firebaseAuth, $window, $filter) {
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
    'VLC',
    'BM'
  ];

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
    else if(unitType === 'BM'){
      apiUnitType = 'Updater';
    }
    else{
      apiUnitType = unitType;
    }

    // create URL for api call
    var generatedUrl = "https://secure-ocean-3120.herokuapp.com/api/v1/products/search?item=" + apiUnitType + "&serial=" + serialNum;
    $http.get(generatedUrl)
    .then(function(response){
      $scope.invApiResponse(unit, response);
    });
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
      var noRadio = ["LR2", "DMF3", "DMF2", "BM"];
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
    doc.save('loaner_receipt.pdf');
  }


}]);
