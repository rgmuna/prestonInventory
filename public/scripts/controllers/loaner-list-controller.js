barcodeApp.controller('LoanerListController', [
  '$scope',
  '$firebaseArray',
  '$firebaseObject',
  '$timeout',
  '$http',
  '$window',
  '$filter',
  'authService',
  function ($scope, $firebaseArray, $firebaseObject, $timeout, $http, $window, $filter, authService) {

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

    var CUSTOMER_OFFSET   = 180;
    var UNIT_OFFSET       = 300;
    var FINE_PRINT_OFFSET = 580;

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
    doc.text(30, 150, 'Prepared By:____________________________');
    doc.text(300, 150, 'Received By:________________________________');


    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text(30, CUSTOMER_OFFSET, 'Customer Info');

    doc.text(30, UNIT_OFFSET, 'Units');
    doc.setFontSize(10);
    doc.text(30, CUSTOMER_OFFSET + 25, 'Name: ');
    doc.text(30, CUSTOMER_OFFSET + 55, 'Shipping: ');
    doc.setFontType('normal');
    doc.text(90, CUSTOMER_OFFSET + 25, customerInfo.name);

    if (customerInfo.shippingAddress.length < 100) {
      doc.text(90, CUSTOMER_OFFSET + 55, customerInfo.shippingAddress);
    } else {
      doc.text(90, CUSTOMER_OFFSET + 55, customerInfo.shippingAddress.substring(0,99) + '-');
      doc.text(90, CUSTOMER_OFFSET + 70, customerInfo.shippingAddress.substring(99));
    }

    doc.setDrawColor(35,50,55);
    doc.setLineWidth(2);
    doc.line(30, CUSTOMER_OFFSET + 5, 590, CUSTOMER_OFFSET + 5);
    doc.line(30, UNIT_OFFSET + 5, 590, UNIT_OFFSET + 5);
    doc.autoTable(columns, rows, {
        theme: 'striped',
        styles: {},
        columnStyles: {},
        margin: {top: UNIT_OFFSET + 20},
        headerStyles: {
          fillColor: [220,220,220],
          textColor: 20
        }
    });

    doc.setFontSize(8)
    doc.text(30, FINE_PRINT_OFFSET, 'Our equipment loan program is provided as a courtesy because we understand the demands of the industry and how much our products are relied upon.');
    doc.text(30, FINE_PRINT_OFFSET + 15, 'In exchange, we ask that you abide by the following policy:');
    doc.text(40, FINE_PRINT_OFFSET + 35, '1. Loan equipment is pending availability for customers who immediately send in a unit for repair.');
    doc.text(40, FINE_PRINT_OFFSET + 50, '2. Once your repair has been picked up, you will return the loaner within 1 week.  [One week is enough time for you to respond to our email, pay for any');
    doc.text(40, FINE_PRINT_OFFSET + 65, '    repair charges, arrange shipping/pickup of the repaired unit and send back loaner].');
    doc.text(40, FINE_PRINT_OFFSET + 80, '3. Our maximum repair turnaround time is 2 weeks so the maximum time for you to be in possession of the loaner is 3 weeks.');
    doc.text(40, FINE_PRINT_OFFSET + 95, '4. Failure to follow this policy will lead to a loss of loan privileges for up to 1 year.  ');
    doc.text(30, FINE_PRINT_OFFSET + 115, 'Please sign here to indicate you understand and will abide by the terms of this equipment loan:');
    doc.setFontSize(12);
    doc.text(30, FINE_PRINT_OFFSET + 160, 'Signature:______________________________________');
    doc.text(360, FINE_PRINT_OFFSET + 160, 'Date:______________________');

    doc.save('loaner_receipt.pdf');
  }


}]);
