barcodeApp.controller('Inv_List_Ctrl', [
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

  $scope.model = {
    view          : 'units',
    stockEditable : false,
    stockObject   : {}
  };

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
    'DM5',
    'BM'
  ];


  $scope.switchView = function(type) {
    $scope.model.view = type;
  }

  $scope.isNavCollapsed = false;

  $scope.authenticated = authService.userLoggedIn;


  //------------- Import Firebase Information -------------

  //product invnetory from Firebase
  $scope.barcodedUnitInfo = firebase.database().ref().child('inventory');
  $scope.barcodedUnits = $firebaseArray($scope.barcodedUnitInfo);

  //cable invnetory from Firebase
  $scope.barcodedCableInfo = firebase.database().ref().child('cableInventory');
  $scope.barcodedCablesArray = $firebaseArray($scope.barcodedCableInfo);

  //accessory invnetory from Firebase
  $scope.barcodedAccessoryInfo = firebase.database().ref().child('accessoryInventory');
  $scope.barcodedAccessories = $firebaseArray($scope.barcodedAccessoryInfo);

  var minThresholdInfo = firebase.database().ref().child('inventoryMinThreshold');
  $scope.minThreshold = $firebaseObject(minThresholdInfo);

  $scope.minThreshold.$loaded().then(function() {
    $scope.model.stockObject = Object.assign({}, $scope.minThreshold);
  });
  //----------------------------------------------------------

  //initilizations
  $scope.barcodeEntered = false;
  $scope.loaded = false;

  // object with currently read barcode
  $scope.barcodeRead = {
    barcodeNum: ''
  };

  $scope.saveStockEdits = function() {
    var list = {};
    for (var item in $scope.model.stockObject) {
      if ($scope.model.stockObject.hasOwnProperty(item) && item[0] != '$') {
        var input = parseInt($scope.model.stockObject[item]);
        if (isNaN(input)) {
          alert('Numer inputs only');
          return;
        } else {
          list[item] = $scope.model.stockObject[item];
        }
      }
    }

    minThresholdInfo.set(list).then(function(response){
      $scope.minThreshold = list;
      $scope.model.stockEditable = false;
      $scope.$apply();
    }, function() {
      alert('Did not save. Try again.');
    })
  };

  $scope.cancelEdit = function() {
    $scope.model.stockEditable = false;
    $scope.model.stockObject = $scope.minThreshold;
  }

  //checks when firebase items are loaded ------
  $scope.barcodedUnits.$loaded().then(function() {
    $scope.loaded = true;
    $scope.loadTable();
    $scope.makeShelfList();
  });

  $scope.currDate = firebase.database.ServerValue.TIMESTAMP;
  $scope.dateLimiter = $scope.currDate - 2592000;

  $scope.inventoryList = true;
  $scope.barcodeChecker = {
    barcodeNum: ''
  };
  $scope.unlistedUnits = [];

  $scope.$watch('barcodeChecker.barcodeNum', function(newValue, oldValue) {
    if($scope.barcodeChecker.barcodeNum){
        $scope.checkInv(newValue);
        $scope.barcodeChecker.barcodeNum = '';
        $scope.playAudio('scanned');
    }
  });
  //not including LR items due to weirdness of labels
  $scope.unitList = ['fi', 'hu3', 'mdr3', 'mdr4', 'dmf3', 'rmf', 'vf3', 'dm1x', 'dm2x', 'dm5', 'bm'];
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
    $scope.bmInv = [];

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
      },
      bm: {
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
    for(var unit in $scope.barcodedUnits){
      if($scope.barcodedUnits[unit].status === "on shelf"){
        var newObj =
          {status: false,
            barcode: $scope.barcodedUnits[unit].barcode
          };
        $scope.shelfUnits.push(newObj);
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

  $scope.resetScans = function(){
    if (confirm("You sure you want to reset all your scans?")) {
      for(var i in $scope.shelfUnits){
        $scope.shelfUnits[i].status = false;
      }
      $scope.unlistedUnits = [];
      $scope.playAudio('alanna');
    }
  }

  $scope.sortType     = 'name'; // set the default sort type
  $scope.sortReverse  = false;  // set the default sort order
  $scope.searchUnits   = '';     // set the default search/filter term


  //submit test to firebase
  $scope.submitTest = function(){
    var submissionDate = $filter('date')(new Date(), 'medium');
    var submitObj = {
      date: submissionDate
    };
    for(var i in $scope.shelfUnits){
      if(!$scope.shelfUnits[i].status){
        submitObj['unit' + i] = angular.copy($scope.shelfUnits[i]);
      }
    }

    // submit to firebase
    var testProperty = Date.now().toString();
    var testsRef = firebase.database().ref().child('tests');
    var testsObj = $firebaseObject(testsRef);

    testsObj.$loaded().then(function() {
      testsRef.child(testProperty).set(
        submitObj
      )
      .then(function(builds){
        console.log('submitted!');
      });

    })
  }

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

}])
//end of controller
