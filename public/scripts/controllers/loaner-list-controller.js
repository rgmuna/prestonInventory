barcodeApp.controller('LoanerListController', ['$scope', '$firebaseArray', '$firebaseObject', '$timeout', '$http', '$filter', function ($scope, $firebaseArray, $firebaseObject, $timeout, $http, $filter) {

  //
  // View Model
  //

  var model = {
    loanerReference: null,
    loanerArray    : null
  };

  //
  // Controller Model
  //

  $scope.model = {
    showUnitList: true,
    loanerArray : null,
    loaded      : false,
    customerObj : {},
    editing     : false
  }

  /**
   * Renders page on load
   * @return {undefined}
   */
  function renderPage() {
    model.loanerReference    = firebase.database().ref().child('loaners');
    $scope.model.loanerArray = $firebaseArray(model.loanerReference);

    $scope.model.loanerArray.$loaded().then(function() {
      $scope.model.loaded = true;
      fixStatuses();
      populateCustomers();
    });
  }

  renderPage();

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
    'BM',
    'LR2W',
    'LR2M',
    'HU4'
  ];

  $scope.loanerSearch    = '';
  $scope.filterVariables = {
    unitType: '',
    status: ''
  }

  $scope.loanerStatuses = ['ready to loan', 'needs QA', 'checked out', 'needs updates'];

  $scope.removeFilter = function(item, selection) {
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

  /**
   * Returns properly formatted unit type for API call
   * @param {string} unit
   * @return {string} formatted string
   */
  function unitTypeForApi(unit) {
    switch (unit) {
      case 'FI':
        return 'F/I';
      case 'MDR3':
        return 'MDR-3';
      case 'MDR2':
        return 'MDR-2';
      case 'MDR4':
        return 'MDR-4';
      case 'LR2':
        return 'LR2';
      case 'VIU':
        return 'VI';
      case 'VF3':
        return 'VF3';
      case 'BM':
        return 'Updater';
      default:
        return unit;
    }
  }

  /**
   * Add statuses for units
   * @return {undefined}
   */
  function fixStatuses() {
    for (var item in $scope.model.loanerArray) {
      if (typeof $scope.model.loanerArray[item] !== 'object' && typeof item != 'number') {
        continue;
      }

      var unitType  = $scope.model.loanerArray[item].unit;

      if (unitType !== "DM2X" && unitType !== "DM2" && unitType !== "DM1X" && unitType !== "DM4X" && unitType !== "DM5" && unitType !== "LR2W" && unitType !== "LR2M" && $scope.model.loanerArray[item].status === 'ready') {
        setUnitStatus(item);
      } else {
        if ($scope.model.loanerArray[item].status === 'ready') {
          $scope.model.loanerArray[item].status = 'ready to loan';
        }
      }
    }
  }

  /**
   * Gets stauses for each of the units from database
   * @param {number} item index from array
   * @return {undefined}
   */
  function setUnitStatus(item) {
    var unitType    = $scope.model.loanerArray[item].unit;
    var serialNum   = $scope.model.loanerArray[item].serialNum;
    var apiUnitType = unitTypeForApi(unitType);

    var request = $http({
      method : 'GET',
      url    : 'https://secure-ocean-3120.herokuapp.com/api/v1/products/search',
      params : {
        item   : apiUnitType,
        serial : serialNum
      }
    });

    request.then(function(response) {
      var data = response.data;
      if (response.data == null) {
        return;
      } else if (data.main_fw_latest && data.mods_latest && data.radio_fw_latest) {
        $scope.model.loanerArray[item].status = 'ready to loan';
      } else {
        $scope.model.loanerArray[item].status = 'update';
      }
    });
  }

  /**
   * Add customers to object
   * @return {undefined}
   */
  function populateCustomers() {
    for (var loaner in $scope.model.loanerArray) {
      //particular item
      var loanerItem = $scope.model.loanerArray[loaner];

      //if item has customer info
      if (loanerItem.customerInfo && loanerItem.status === "checked out") {
        //if customer info has a name (i.e. is populated)
        if (loanerItem.customerInfo.name) {
          //remove all symbols and spaces
          var formatName = loanerItem.customerInfo.name.replace(/[^a-zA-Z0-9]/g, '');

          //if customer is in the customer obj
          if ($scope.model.customerObj.hasOwnProperty(formatName)) {
            $scope.model.customerObj[formatName].units[loanerItem.unitBarcode] = {
              unitBarcode : loanerItem.unitBarcode,
              firmware    : loanerItem.firmware,
              location    : loanerItem.location,
              mods        : loanerItem.mods,
              notes       : loanerItem.notes,
              radio       : loanerItem.radio,
              serialNum   : loanerItem.serialNum,
              status      : loanerItem.status,
              timeStamp   : loanerItem.timeStamp,
              unit        : loanerItem.unit,
            };
            $scope.model.customerObj[formatName].numUnits++;
          } else {
            //create new item in customer object w/ customer info and units
            $scope.model.customerObj[formatName] = {
              customerInfo: "",
              units       : {},
              numUnits    : 1
            };

            //populate customer info
            $scope.model.customerObj[formatName].customerInfo = loanerItem.customerInfo;
            //populate units
            $scope.model.customerObj[formatName].units[loanerItem.unitBarcode] = {
              unitBarcode : loanerItem.unitBarcode,
              firmware    : loanerItem.firmware,
              location    : loanerItem.location,
              mods        : loanerItem.mods,
              notes       : loanerItem.notes,
              radio       : loanerItem.radio,
              serialNum   : loanerItem.serialNum,
              status      : loanerItem.status,
              timeStamp   : loanerItem.timestamp,
              unit        : loanerItem.unit,
            };
          }
        }
      }
    }
  }


  /**
   * Edit customer info for user
   * @param {object} value - object for specific customer
   * @param {string} status - action that user is performing
   * @return {undefined}
   */
  $scope.editInfo = function(value, status) {
    var oldValue = value.customerInfo;

    if (status==='edit') {
      $scope.editValues = {
        name            : oldValue.name,
        email           : oldValue.email,
        phoneNum        : oldValue.phoneNum,
        repairNum       : oldValue.repairNum,
        shippingAddress : oldValue.shippingAddress,
        notes           : oldValue.notes
      }
      $scope.model.editing = true;
    } else if(status==='cancel') {
      $scope.model.editing = false;
    } else if (status==='save') {
      $scope.model.editing = false;

      for (var i in  value.units) {
        var barcode = value.units[i].unitBarcode;

        model.loanerReference.child(barcode).child('customerInfo').set(
          $scope.editValues
        ).then(function() {
          value.customerInfo = $scope.editValues;
        })
        .catch(function(error){
          alert(error + " try saving again");
          $scope.model.editing = true;
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
