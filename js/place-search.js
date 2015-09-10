/**
 * Visualisation to display PEF statistics globally
 *
 * @author  Cameron Green <i@camerongreen.org>
 * @date  2015-09-10
 */
// create a quasi namespace
var PBF = PBF || {};

(function ($) {
  PBF.ps = {
    dataTable: null,
    dataView: null,
    map: null,
    chart: null,
    spreadsheet: 'https://spreadsheets.google.com/tq?key=1z-Y4EWAlkFcKZNdAHIaXvyH3MtVvYT1JnusnVEAnLew',
    markerImage: 'images/mm_20_white.png',
    mapZoom: 3,
    mapZoomed: 15,
    lineColour: '#FFFFFF',
    lineOpacity: .5,
    hideColumns: [
      'Lat',
      'Lat',
      'Lng',
//      'Km',
      'Geocoded address',
      'Geocoding date',
      'Geocode result'
    ],
    mapCentre: {
      lat: 2,
      lng: 135
    },
    numClosestVenues: 5,
    circumferenceEarth: 40755,
    markers: [],
    infoWindows: [],
    products: [],
    searchObject: [],
    column: {}
  };

  /**
   * Loads a google spreadsheet
   */
  PBF.ps.loadVisualisations = function () {
    new google.visualization.Query(PBF.ps.spreadsheet).send(PBF.ps.initVisualisations);
  };

  /**
   * Callback to take the loaded spreadsheet, pull the data table
   * and initialise the visualisations
   *
   * @param response
   */
  PBF.ps.initVisualisations = function (response) {
    PBF.ps.dataTable = response.getDataTable();
    PBF.ps.column.data = PBF.ps.dataTable.addColumn('number', 'Km');
    PBF.ps.dataView = new google.visualization.DataView(PBF.ps.dataTable);

    PBF.ps.populateColumnIndexes();
    PBF.ps.drawMap();
    PBF.ps.drawVisualisations();
    PBF.ps.populateProducts();
    $('#ps-loader').hide();
    $('#ps-content').show();
  };

  /**
   * Draws the map and dataview from current state of global arrays
   */
  PBF.ps.drawVisualisations = function () {
    PBF.ps.drawDataView(PBF.ps.dataView);
    PBF.ps.removeMapElements();
    PBF.ps.drawPlacemarks(PBF.ps.map, PBF.ps.dataView);
    PBF.ps.fitBounds();
  };

  /**
   * Populates the column indexes
   */
  PBF.ps.populateColumnIndexes = function () {
    for (var i = 0, l = PBF.ps.dataView.getNumberOfColumns(); i < l; i++) {
      PBF.ps.column[PBF.ps.dataView.getColumnLabel(i)] = i;
    }
  };

  /**
   * Draws markers on the map representing the passed in data
   *
   * @param {Object}  map
   * @param {Object}  dataView
   */
  PBF.ps.drawPlacemarks = function (map, dataView) {
    for (var r = 0, nr = dataView.getNumberOfRows(); r < nr; r++) {
      var row = PBF.ps.getRow(dataView, r);
      PBF.ps.addPlacemark(map, row.Lat, row.Lng, row.Name, null, row);
      PBF.ps.addProducts(row.Products);
    }
  };

  /**
   * Adds products to ordered global array
   *
   * @param {string} productsStr
   */
  PBF.ps.addProducts = function (productsStr) {
    var products = productsStr.split(/\s*,\s*/);

    for (var i = 0, l = products.length; i < l; i++) {
      if (PBF.ps.products.indexOf(products[i]) === -1) {
        PBF.ps.products.push(products[i]);
      }
    }

    PBF.ps.products.sort();
  };

  /**
   * Populates the product select
   */
  PBF.ps.populateProducts = function () {
    for (var i = 0, l = PBF.ps.products.length; i < l; i++) {
      $('#product').append($('<option>', {text: PBF.ps.products[i]}));
    }
  };

  /**
   * Gets a Row into an object for easier use
   *
   * @param {Object} dataView
   * @param {int} rowNum
   * @return  {Object}
   */
  PBF.ps.getRow = function (dataView, rowNum) {
    var returnVal = {};
    for (var c = 0, nc = dataView.getNumberOfColumns(); c < nc; c++) {
      var columnName = dataView.getColumnLabel(c);
      var columnValue = dataView.getValue(rowNum, c);
      if (['Lat', 'Lng'].indexOf(columnName) !== -1) {
        returnVal[columnName] = parseFloat(columnValue);
      } else {
        returnVal[columnName] = columnValue;
      }
    }
    return returnVal;
  };

  /**
   * Add a placemark to the map
   *
   * @param map
   * @param lat
   * @param lng
   * @param title
   * @param image
   * @param {Object} display  Display in popup
   */
  PBF.ps.addPlacemark = function (map, lat, lng, title, image, display) {
    var myLatLng = new google.maps.LatLng(lat, lng);
    var icon = new google.maps.MarkerImage(PBF.ps.markerImage);
    var marker = new google.maps.Marker({
      map: map,
      position: myLatLng,
      title: title,
      icon: icon
    });

    PBF.ps.markers.push(marker);

    PBF.ps.infoWindows.push(PBF.ps.makeInfoWindow(title, image, display));

    var position = PBF.ps.infoWindows.length - 1;

    var callback = (function closure(place) {
      return function () {
        PBF.ps.closeAllWindows();
        PBF.ps.infoWindows[place].open(map, PBF.ps.markers[place]);
      };
    })(position);

    google.maps.event.addListener(marker, 'click', callback);
  };

  /**
   * Removes any existing elements from the map
   */
  PBF.ps.removeMapElements = function () {
    PBF.ps.markers = [];
    PBF.ps.closeAllWindows();
    PBF.ps.infoWindows = [];
  };

  /**
   * Make an info window popup
   *
   * @param title
   * @param image
   * @param {Object} display  Display in popup
   */
  PBF.ps.makeInfoWindow = function (title, image, display) {
    var content = '<div class="ps-info-window-content">';

    if (image !== null) {
      content += '<div class="col-sm-4"><img src="' + image + '" alt="' + title + ' Photo" class="img-responsive img-thumbnail"/></div><div class="col-sm-8">';
    }

    content += '<h4>' + title + '</h4>' + '<table class="table" role="table">';

    for (var key in display) {
      if (display.hasOwnProperty(key) && (key !== 'Name') && (PBF.ps.hideColumns.indexOf(key) === -1)) {
        content += '<tr><td><i class="glyphicon glyphicon-star-empty"></i></span> ' + key + '</td><td>' + display[key] + '</td></tr>';
      }
    }

    content += '</table></div>';

    if (image !== null) {
      content += '</div>';
    }

    return new google.maps.InfoWindow({
      content: content
    });
  }
  ;

  /**
   * Shows a google GeoChart visualisation to the '#map' html element
   */
  PBF.ps.drawMap = function () {
    var mapOptions = {
      center: {lat: PBF.ps.mapCentre.lat, lng: PBF.ps.mapCentre.lng},
      zoom: PBF.ps.mapZoom,
      minZoom: 2,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    PBF.ps.map = new google.maps.Map(document.getElementById('ps-map'), mapOptions);
  };

  /**
   * Allow user to click on table and zoom map
   */
  PBF.ps.rowSelectFunction = function () {
    var select = PBF.ps.chart.getSelection();
    if (select.length > 0) {
      var row = PBF.ps.getRow(PBF.ps.dataView, select[0].row);
      var pos = new google.maps.LatLng(row.Lat, row.Lng);
      PBF.ps.map.setCenter(pos);
      PBF.ps.map.setZoom(PBF.ps.mapZoomed);
      PBF.ps.closeAllWindows();
    }
  };

  /**
   * Close all pop up windows
   */
  PBF.ps.closeAllWindows = function () {
    for (var i = 0; i < PBF.ps.infoWindows.length; i++) {
      PBF.ps.infoWindows[i].close();
    }
  };

  /**
   * Shows a google Table visualisation to the '#data-table' html element
   *
   * @param dataView
   */
  PBF.ps.drawDataView = function (dataView) {
    var options = {};

    var displayDataView = new google.visualization.DataView(dataView);

    var hideColumnIndexes = [];
    for (var c = 0, l = displayDataView.getNumberOfColumns(); c < l; c++) {
      var columnName = PBF.ps.dataView.getColumnLabel(c);
      if (PBF.ps.hideColumns.indexOf(columnName) !== -1) {
        hideColumnIndexes.push(c);
      }
    }

    displayDataView.hideColumns(hideColumnIndexes);

    PBF.ps.chart = new google.visualization.Table(document.getElementById('ps-data-table'));
    PBF.ps.chart.draw(displayDataView, options);
    google.visualization.events.addListener(PBF.ps.chart, 'select', PBF.ps.rowSelectFunction);
  };

  /**
   * Fit the map to the active markers
   */
  PBF.ps.fitBounds = function () {
    var bounds = new google.maps.LatLngBounds();
    for (i = 0; i < PBF.ps.markers.length; i++) {
      bounds.extend(PBF.ps.markers[i].getPosition());
    }

    PBF.ps.map.fitBounds(bounds);
  };

  PBF.ps.showNoResults = function () {
    $("#ps-dialog-message").prop('title', 'No results');
    $("#ps-dialog-message").text("Please change your selections and try again");
    $("#ps-dialog-message").dialog({
      modal: true,
      buttons: {
        Ok: function () {
          $(this).dialog("close");
        }
      }
    });
  };

  /**
   * Add distance columns to datatable
   *
   * @param {Object} dataTable
   * @param {Object} obj
   * @param {string} product
   * @returns {int}
   */
  PBF.ps.addDistance = function (dataTable, obj, product) {
    for (var r = 0, nr = dataTable.getNumberOfRows(); r < nr; r++) {
      var row = PBF.ps.getRow(dataTable, r);
      var hasProduct = product === 'All' || PBF.ps.hasProduct(row.Products, product);
      var distance = hasProduct ? PBF.ps.distance(row.Lat, row.Lng, obj.lat, obj.lng) : PBF.ps.circumferenceEarth;
      dataTable.setCell(r, PBF.ps.column.data, distance.toFixed(2));
    }

    dataTable.sort(PBF.ps.column.data);
  };

  /**
   * Calculate the distance between two lat lng points
   *
   * @param lat1
   * @param lon1
   * @param lat2
   * @param lon2
   * @returns {number}
   */
  PBF.ps.distance = function (lat1, lon1, lat2, lon2) {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var radlon1 = Math.PI * lon1 / 180;
    var radlon2 = Math.PI * lon2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    return dist * 1.609344;
  };

  /**
   * Check if product in product string
   *
   * @param productsString
   * @param product
   * @returns {boolean}
   */
  PBF.ps.hasProduct = function (productsString, product) {
    var products = productsString.split(',');
    var product = product.trim().toLowerCase();
    for (var i = 0, l = products.length; i < l; i++) {
      if (products[i].trim().toLowerCase() === product) {
        return true;
      }
    }
    return false;
  };


  /**
   * Filter the data and map markers according to the
   * form state
   *
   * @param {string}  instigator
   */
  PBF.ps.applyFilters = function (instigator) {
    // only allow either state or search, never both
    if (instigator === 'state') {
      $('#search').val('');
    } else if (instigator === 'search') {
      $('#state').val('All');
    }

    var product = $("#product").val();
    var state = $("#state").val();
    var search = $("#search").val();

    /**
     * Callback filter to check if product matches
     *
     * @param value
     * @returns {boolean}
     */
    function checkProduct(value) {
      return PBF.ps.hasProduct(value, product);
    };

    // create filters
    var filters = [];

    if (search !== '') {
      var parts = search.split(',');
      if (parts.length === 2) {
        /*
         * simple suburb search
         filters.push({
         column: PBF.ps.column.Postcode,
         value: parseInt(parts[1], 10)
         });
         filters.push({
         column: PBF.ps.column.Suburb,
         value: parts[0]
         });
         */
        PBF.ps.addDistance(PBF.ps.dataTable, PBF.ps.searchObject, product);

        filters.push({
          test: function (value, rowNum) {
            return rowNum < PBF.ps.numClosestVenues;
          },
          column: PBF.ps.column.Lat, // dummy values
          minValue: -100, // dummy values
          maxValue: 100, // dummy values
        });

        filters.push({
          column: PBF.ps.column.data,
          maxValue: PBF.ps.circumferenceEarth - 1
        });
      }
    } else {
      if (state !== 'All') {
        filters.push({
          column: PBF.ps.column.State,
          value: state
        });
      }

      if (product !== 'All') {
        filters.push({
          column: PBF.ps.column.Products,
          test: checkProduct
        });
      }
    }

    if (filters.length > 0) {
      PBF.ps.dataView.setRows(
        PBF.ps.dataTable.getFilteredRows(filters)
      );
    } else {
      PBF.ps.dataView = new google.visualization.DataView(PBF.ps.dataTable);
    }

    if (PBF.ps.dataView.getNumberOfRows() > 0) {
      // redraw map
      PBF.ps.drawVisualisations();
    } else {
      PBF.ps.showNoResults();
    }
  };

  // go ...
  google.load('visualization', '1', {packages: ['table']});
  google.maps.event.addDomListener(window, 'load', PBF.ps.loadVisualisations);

  /*
   * jQuery function to reset map
   */
  $(document).ready(function () {
    $.getJSON('js/postcodes.json', function (results) {
      var postcodes = $.map(results, function (value) {
        return {
          label: value.sub + ', ' + value.pc,
          value: value.sub + ', ' + value.pc,
          obj: value
        };
      });
      $('#search').autocomplete({
        minLength: 4,
        source: postcodes,
        select: function (event, ui) {
          PBF.ps.searchObject = ui.item.obj;
          PBF.ps.applyFilters(this.id);
          return false;
        },
        focus: function (event, ui) {
          $('#search').val(ui.item.label);
          return false;
        }
      });
    }).fail(function (jqxhr, textStatus, error) {
      var err = textStatus + ', ' + error;
      console.log('Request Failed: ' + err);
    });

    $('#reset-map').click(function () {
      PBF.ps.dataView = new google.visualization.DataView(PBF.ps.dataTable);
      $('#state').val('All');
      $('#product').val('All');
      $('#search').val('');
      PBF.ps.drawVisualisations();
    });

    $('#state, #product').change(function () {
      PBF.ps.applyFilters(this.id);
    });

    $("#search").keypress(function (e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if (code == 13) { //Enter keycode
        return false;
      }
    });
  });
})(jQuery);


