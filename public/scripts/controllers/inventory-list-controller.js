barcodeApp.controller('InventoryListController', ['$rootScope', '$scope', '$firebaseArray', '$firebaseObject', '$document', '$filter', '$uibModal', 'productService', function ($rootScope, $scope, $firebaseArray, $firebaseObject, $document, $filter, $uibModal, productService) {

  //
  // Controller Model
  //

  var model = {
    productFirebaseReference: firebase.database().ref().child('inventory'),
    productStoredArray      : '',
    constants               : {
      ON_SHELF : 'on shelf',
      PURCHASED: 'checked out - purchase',
      OTHER    : 'checked out - other'
    }
  }

  //
  // View Model
  //

  $scope.model = {
    productInventory : {
      stock : {},
      byUnit: {}
    },
    cableInventory      : [],
    accessoryInventory  : [],
    loaded              : false,
    minThresholdObject  : {},
    inventoryListView   : true,
    showUnitsByType     : false,
    showUnitTypeList    : '',
    view                : 'units',
    stockEditable       : false,
    stockObject         : {},
    sortType            : 'name',
    sortReverse         : false,
    searchUnits         : '',
    cableSortType       : '',
    cableSortReverse    : false,
    accessorySortType   : '',
    accessorySortReverse: false,
    accessoryFilter     : '',
    accessoryCategories : ['motor mounts', 'gears', 'light ranger 2', 'other']
  };

  function renderPage() {
    model.productStoredArray = $firebaseArray(model.productFirebaseReference);
    model.productStoredArray.$loaded().then(function() {
      $scope.model.loaded = true;
      loadProductTable();
      // $scope.makeShelfList();
    });

    $scope.model.cableInventory     = $firebaseArray(firebase.database().ref().child('cableInventory'));
    $scope.model.accessoryInventory = $firebaseArray(firebase.database().ref().child('accessoryInventory'));

    loadMinThreshold();
  }

  renderPage();

  /**
   * Load inventory table
   * @return {undefined}
   */
  function loadProductTable() {
    for (var i = 0; i <  model.productStoredArray.length; i++) {
      var singleItem =  model.productStoredArray[i];
      addToStocklist(singleItem);
      addToUnitLists(singleItem);
    }
  }

  /**
   * Add to inventory stock lists
   * Each product:
   * - onShelf
   * - outOther
   * @param {object} item
   */
  function addToStocklist(item) {
    var itemCategory = item.unit;

    if (!$scope.model.productInventory.stock.hasOwnProperty(itemCategory)) {
      $scope.model.productInventory.stock[itemCategory] = {
        onShelf : 0,
        outOther: 0
      }
    }

    switch(item.status) {
      case model.constants.ON_SHELF:
        $scope.model.productInventory.stock[itemCategory].onShelf++;
        break;
      case model.constants.OTHER:
        $scope.model.productInventory.stock[itemCategory].outOther++;
        break;
    }
  }

  /**
   * Add to unit lists
   * @param {object} item
   */
  function addToUnitLists(item) {
    var itemCategory = item.unit;

    if (!$scope.model.productInventory.byUnit.hasOwnProperty(itemCategory)) {
      $scope.model.productInventory.byUnit[itemCategory] = [];
    }

    if (item.status === model.constants.ON_SHELF) {
      $scope.model.productInventory.byUnit[itemCategory].push(item);
    }
  }

  /**
   * Load min threshold object
   * @return {undefined}
   */
  function loadMinThreshold() {
    var minThresholdInfo            = firebase.database().ref().child('inventoryMinThreshold');
    $scope.model.minThresholdObject = $firebaseObject(minThresholdInfo);

    $scope.model.minThresholdObject.$loaded().then(function() {
      $scope.model.stockObject = Object.assign({}, $scope.model.minThresholdObject);
    });
  }

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
        playAudio('scanned');
    }
  });
  //not including LR items due to weirdness of labels
  $scope.unitList        = ['fi', 'hu3', 'mdr3', 'mdr4', 'dmf3', 'rmf', 'vf3', 'dm1x', 'dm2x', 'dm5', 'bm', 'lr2w', 'lr2m'];

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

  /**
   * Show list of stored units by category
   * @param {string} unitType
   */
  $scope.revealStoredUnits = function(unitType) {
    $scope.model.showUnitTypeList = unitType;
  }


  // update this eventually
  // $scope.makeShelfList = function(){
  //   $scope.shelfUnits = [];
  //   for(var unit in $scope.barcodedUnits){
  //     if($scope.barcodedUnits[unit].status === "on shelf"){
  //       var newObj =
  //         {status: false,
  //           barcode: $scope.barcodedUnits[unit].barcode
  //         };
  //       $scope.shelfUnits.push(newObj);
  //     }
  //   }
  // }

  $scope.categorySort = function(unitType) {
    return function(unit) {
      var barcode = unit.barcode;
      if (unitType === "LR2 Sensor") {
        if(barcode.includes("s/n LR")){
          return unit;
        }
      }
      else if (unitType === "LR2 VIU") {
        if (barcode.includes("s/n VOU")) {
          return unit;
        }
      }
      else if (barcode.includes(unitType)) {
        return unit;
      }
      else {
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
      playAudio('alanna');
    }
  }

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

  /**
   * Plays audio file for
   * @param {string} sound
   */
  function playAudio(sound) {
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
          })

          loadProductTable();
        }
      })
    }
  }

  $scope.removeFilter = function(option) {
    if (!option) {
      console.log('in here');
      $scope.model.accessoryFilter = "";
    }
  }

}])
.controller('EditUnitController', ['$scope', '$uibModalInstance', 'unit', function($scope, $uibModalInstance, unit){

  //View model
  $scope.model = {
    unit     : unit.barcode,
    selected : ''
  }


  $scope.enter = function() {
      $uibModalInstance.close('test');
  }

  $scope.exit = function() {
    $uibModalInstance.close();
  }

  $scope.save = function() {
    $uibModalInstance.close(cleanStatus());
  }

  function cleanStatus() {
    switch($scope.model.selected) {
      case 'missing':
          return 'confirmed - missing'
      case 'loaned':
          return 'permanently loaned'
      case 'onShelf':
        return 'on shelf'
      case 'purchased':
        return 'checked out - purchase'
      case 'other':
        return 'checked out - other'
    }
  }

}]);
