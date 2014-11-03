/*global google */
/**
 * Visualisation to display CEF statistics globally
 *
 * @author  Cameron Green <cam@uq.edu.au>
 * @date  2014-10-29
 */
// create a quasi namespace
var UQL = UQL || {};

UQL.pefDataTable = null;
UQL.map = null;
UQL.chart = null;
UQL.spreadSheet = 'https://spreadsheets.google.com/tq?key=1eQqryMh3q6OwIMKfT5VPkLXvYJEFyPt4klwuVoUTpBA';
UQL.markerImage = 'http://labs.google.com/ridefinder/images/mm_20_white.png';
UQL.mapZoom = 3;
UQL.mapZoomed = 8;
UQL.lineColour = '#FFFFFF';
UQL.lineOpacity = .5;

UQL.hideColumns = [
  'Lat',
  'Lng',
  'Geo Address'
];

UQL.address = {
  lat: -27.497516,
  lng: 153.013206,
  title: 'The University of Queensland',
  details: {
    campus: 'St Lucia',
    country: 'Australia'
  }
};

UQL.mapCentre = {
  lat: 2,
  lng: 135
};

/**
 * Loads a google spreadsheet
 */
UQL.loadVisualisations = function () {
  new google.visualization.Query(UQL.spreadSheet).send(UQL.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param response
 */
UQL.drawVisualisations = function (response) {
  UQL.pefDataTable = response.getDataTable();

  UQL.drawMap();
  UQL.drawConnections(UQL.map, UQL.pefDataTable);
  UQL.drawDataTable(UQL.pefDataTable);
  UQL.drawToolbar(UQL.spreadSheet);
};

/**
 * Draws markers and lines on the map representing the passed in data
 *
 * @param {Object}  map
 * @param {Object}  dataTable
 */
UQL.drawConnections = function (map, dataTable) {
  UQL.addPlacemark(map, UQL.address.lat, UQL.address.lng, UQL.address.title, UQL.address.details);

  for (var r = 0, nr = dataTable.getNumberOfRows(); r < nr; r++) {
    var row = UQL.getRow(dataTable, r);
    var scale = .1;
    UQL.drawLine(map, UQL.address.lat, UQL.address.lng, row.Lat, row.Lng, scale);
    UQL.addPlacemark(map, row.Lat, row.Lng, row['Partner Name'], row);
  }
};

/**
 * gets a Row into an object for easier use
 */
UQL.getRow = function (dataTable, rowNum) {
  var returnVal = {};
  for (var c = 0, nc = dataTable.getNumberOfColumns(); c < nc; c++) {
    var columnName = dataTable.getColumnLabel(c);
    var columnValue = dataTable.getValue(rowNum, c);
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
 * @param {Object} display  Display in popup
 */
UQL.addPlacemark = function (map, lat, lng, title, display) {
  var myLatLng = new google.maps.LatLng(lat, lng);
  var icon = new google.maps.MarkerImage(UQL.markerImage);
  var marker = new google.maps.Marker({
    map: map,
    position: myLatLng,
    title: title,
    icon: icon
  });

  var content = '<div class="popup-content">' +
    '<h2>' + title + '</h2>' +
    '<table class="table" role="table">';

  for (var i in display) {
    if (display.hasOwnProperty(i) && (UQL.hideColumns.indexOf(i) === -1)) {
      content += '<tr><td>' + i + ' : </td><td>' + display[i] + '</td></tr>';
    }
  }

  content += '</table></div>';

  var infoWindow = new google.maps.InfoWindow({
    content: content
  });

  google.maps.event.addListener(marker, 'click', function () {
    infoWindow.open(map, marker);
  });
};

UQL.drawLine = function (map, sLat, sLng, eLat, eLng, scale) {
  var line = [
    new google.maps.LatLng(sLat, sLng),
    new google.maps.LatLng(eLat, eLng)
  ];

  new google.maps.Polyline({
    map: map,
    path: line,
    strokeWeight: Math.ceil(scale * 10),
    strokeOpacity: UQL.lineOpacity,
    strokeColor: UQL.lineColour
  });
};


/**
 * Draw the toolbar
 *
 * @param {String}  spreadSheet
 */
UQL.drawToolbar = function (spreadSheet) {
  var components = [
    {type: 'html', datasource: spreadSheet},
    {type: 'csv', datasource: spreadSheet}
  ];

  var container = document.getElementById('toolbar-div');
  google.visualization.drawToolbar(container, components);

  // dodgy hacks to make it look bootstrappy
  $('#toolbar-div > span > div').removeClass('charts-menu-button').addClass('form-control').addClass('btn').addClass('btn-success');
  $('#toolbar-div div').removeClass('button-inner-box').removeClass('charts-menu-button-inner-box').removeClass('charts-menu-button-outer-box');
  $('#toolbar-div > span span').html('Export data');
};


/**
 * Shows a google GeoChart visualisation to the '#map' html element
 *
 * Globals:
 *   UQL.pefDataTable
 */
UQL.drawMap = function () {
  var mapOptions = {
    center: {lat: UQL.mapCentre.lat, lng: UQL.mapCentre.lng},
    zoom: UQL.mapZoom,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  };
  UQL.map = new google.maps.Map(document.getElementById('map'), mapOptions);
};

/**
 * Allow user to click on table and zoom map
 */
UQL.rowSelectFunction = function () {
  var select = UQL.chart.getSelection();
  if (select.length > 0) {
    var row = UQL.getRow(UQL.pefDataTable, select[0].row);
    var pos = new google.maps.LatLng(row.Lat, row.Lng);
    UQL.map.setCenter(pos);
    UQL.map.setZoom(UQL.mapZoomed);
  }
};

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * @param dataTable
 */
UQL.drawDataTable = function (dataTable) {
  var options = {};

  var displayDataView = new google.visualization.DataView(dataTable);

  var hideColumnIndexes = [];
  for (var c = 0, l = displayDataView.getNumberOfColumns(); c < l; c++) {
    var columnName = UQL.pefDataTable.getColumnLabel(c);
    if (UQL.hideColumns.indexOf(columnName) !== -1) {
      hideColumnIndexes.push(c);
    }
  }

  displayDataView.hideColumns(hideColumnIndexes);

  UQL.chart = new google.visualization.Table(document.getElementById('data-table'));
  UQL.chart.draw(displayDataView, options);
  google.visualization.events.addListener(UQL.chart, 'select', UQL.rowSelectFunction);
};


// go ...
google.load('visualization', '1', {packages: ['table']});
google.maps.event.addDomListener(window, 'load', UQL.loadVisualisations);

/*
 * jQuery function to reset map
 */
$('#reset-map').click(function () {
  var pos = new google.maps.LatLng(UQL.mapCentre.lat, UQL.mapCentre.lng);
  UQL.map.setCenter(pos);
  UQL.map.setZoom(UQL.mapZoom);
});


