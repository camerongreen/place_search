/*global google */
/**
 * Visualisation to display PEF statistics globally
 *
 * @author  Cameron Green <cam@uq.edu.au>
 * @date  2014-10-29
 */
// create a quasi namespace
var UQL = UQL || {};

UQL.pef = {
  dataTable: null,
  map: null,
  chart: null,
  spreadSheet: 'https://spreadsheets.google.com/tq?key=1eQqryMh3q6OwIMKfT5VPkLXvYJEFyPt4klwuVoUTpBA',
  markerImage: 'http://labs.google.com/ridefinder/images/mm_20_white.png',
  mapZoom: 3,
  mapZoomed: 7,
  lineColour: '#FFFFFF',
  lineOpacity: .5,
  hideColumns: [
    'Lat',
    'Lng',
    'Geo Address'
  ],
  address: {
    lat: -27.497516,
    lng: 153.013206,
    title: 'The University of Queensland',
    image: 'images/UQ.png',
    details: {
      City: 'Brisbane',
      Country: 'Australia'
    }
  },
  mapCentre: {
    lat: 2,
    lng: 135
  },
  markers : {},
  infoWindows : {},
};

/**
 * Loads a google spreadsheet
 */
UQL.pef.loadVisualisations = function () {
  new google.visualization.Query(UQL.pef.spreadSheet).send(UQL.pef.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param response
 */
UQL.pef.drawVisualisations = function (response) {
  UQL.pef.dataTable = response.getDataTable();

  $('#pef-loader').hide();
  UQL.pef.drawMap();
  UQL.pef.drawConnections(UQL.pef.map, UQL.pef.dataTable);
  UQL.pef.drawDataTable(UQL.pef.dataTable);
  UQL.pef.drawToolbar(UQL.pef.spreadSheet);
};

/**
 * Draws markers and lines on the map representing the passed in data
 *
 * @param {Object}  map
 * @param {Object}  dataTable
 */
UQL.pef.drawConnections = function (map, dataTable) {
  UQL.pef.addPlacemark(map, UQL.pef.address.lat, UQL.pef.address.lng, UQL.pef.address.title, UQL.pef.address.image, UQL.pef.address.details);

  for (var r = 0, nr = dataTable.getNumberOfRows(); r < nr; r++) {
    var row = UQL.pef.getRow(dataTable, r);
    var scale = .1;
    UQL.pef.drawLine(map, UQL.pef.address.lat, UQL.pef.address.lng, row.Lat, row.Lng, scale);
    UQL.pef.addPlacemark(map, row.Lat, row.Lng, row['Partner Name'], null, row);
  }
};

/**
 * gets a Row into an object for easier use
 */
UQL.pef.getRow = function (dataTable, rowNum) {
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
 * @param image
 * @param {Object} display  Display in popup
 */
UQL.pef.addPlacemark = function (map, lat, lng, title, image, display)
{
  var myLatLng = new google.maps.LatLng(lat, lng);
  var icon = new google.maps.MarkerImage(UQL.pef.markerImage);
  var key = title + lat + lng;
  UQL.pef.markers[key] = new google.maps.Marker({
    map: map,
    position: myLatLng,
    title: title,
    icon: icon
  });

  UQL.pef.infoWindows[key] = UQL.pef.makeInfoWindow(title, image, display);

  google.maps.event.addListener(UQL.pef.markers[key], 'click', function (event) {
    UQL.pef.infoWindows[key].open(map, UQL.pef.markers[key]);
  });
};

/**
 /**
 * Add a placemark to the map
 *
 * @param title
 * @param image
 * @param {Object} display  Display in popup
 */
UQL.pef.makeInfoWindow = function (title, image, display)
{
  var content = '<div class="pef-info-window-content">';
  if (image !== null) {
    content += '<div class="col-sm-4"><img src="' + image + '" alt="' + title + ' Logo" class="img-responsive img-thumbnail"/></div><div class="col-sm-8">';
  }
  content += '<h3>' + title + '</h3>' +
  '<table class="table" role="table">';

  content += '<tr><td><span><i class="glyphicon glyphicon-globe"></i></span> City</td><td>' + display.City + ', ' + display.Country + '</td></tr>';
  if (display.hasOwnProperty('Students')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Students</td><td>' + display.Students + '</td></tr>';
  }
  if (display.hasOwnProperty('Staff')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Staff</td><td>' + display.Staff + '</td></tr>';
  }
  if (display.hasOwnProperty('Publications')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-book"></i></span> Publications</td><td>' + display.Publications + '</td></tr>';
  }
  if (display.hasOwnProperty('Collaborations')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-transfer"></i></span> Collaborations</td><td>' + display.Collaborations + '</td></tr>';
  }

  content += '</table></div>';

  if (image !== null) {
    content += '</div>';
  }

  var infoWindow = new google.maps.InfoWindow({
    content: content
  });

  return infoWindow;
}
;

/**
 *
 * Draw a line from one point of a map to another
 *
 * @param {Object} map
 * @param sLat
 * @param sLng
 * @param eLat
 * @param eLng
 * @param scale 0.1 - 1 for thickness of line
 */
UQL.pef.drawLine = function (map, sLat, sLng, eLat, eLng, scale) {
  var line = [
    new google.maps.LatLng(sLat, sLng),
    new google.maps.LatLng(eLat, eLng)
  ];

  new google.maps.Polyline({
    map: map,
    path: line,
    strokeWeight: Math.ceil(scale * 10),
    strokeOpacity: UQL.pef.lineOpacity,
    strokeColor: UQL.pef.lineColour
  });
};


/**
 * Draw the toolbar
 *
 * @param {String}  spreadSheet
 */
UQL.pef.drawToolbar = function (spreadSheet) {
  var components = [
    {type: 'html', datasource: spreadSheet},
    {type: 'csv', datasource: spreadSheet}
  ];

  var container = document.getElementById('pef-toolbar-div');
  google.visualization.drawToolbar(container, components);

  // dodgy hacks to make it look bootstrappy
  $('#pef-toolbar-div > span > div').removeClass('charts-menu-button').addClass('form-control').addClass('btn').addClass('btn-success');
  $('#pef-toolbar-div div').removeClass('button-inner-box').removeClass('charts-menu-button-inner-box').removeClass('charts-menu-button-outer-box');
  $('#pef-toolbar-div > span span').html('Export data');
};


/**
 * Shows a google GeoChart visualisation to the '#map' html element
 *
 * Globals:
 *   UQL.pef.dataTable
 */
UQL.pef.drawMap = function () {
  var styles = [
    {
      featureType: "road",
      stylers: [
        { visibility: "off" }
      ]
    },
    {
      featureType: "administrative.country",
      elementType: "geometry.stroke",
      stylers: [
        { color: "#ffffff" },
        { saturation: -100 },
        { lightness: 100 }
      ]
    },
    {
      featureType: "administrative.neighborhood",
      stylers: [
        { visibility: "off" }
      ]
    },
    {
      featureType: "administrative.land_parcel",
      stylers: [
        { visibility: "off" }
      ]
    }
  ];

  var mapOptions = {
    center: {lat: UQL.pef.mapCentre.lat, lng: UQL.pef.mapCentre.lng},
    zoom: UQL.pef.mapZoom,
    minZoom: 2,
    //mapTypeId: google.maps.MapTypeId.SATELLITE
    //mapTypeId: google.maps.MapTypeId.HYBRID,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: styles
  };
  UQL.pef.map = new google.maps.Map(document.getElementById('pef-map'), mapOptions);
};

/**
 * Allow user to click on table and zoom map
 */
UQL.pef.rowSelectFunction = function () {
  var select = UQL.pef.chart.getSelection();
  if (select.length > 0) {
    var row = UQL.pef.getRow(UQL.pef.dataTable, select[0].row);
    var pos = new google.maps.LatLng(row.Lat, row.Lng);
    UQL.pef.map.setCenter(pos);
    UQL.pef.map.setZoom(UQL.pef.mapZoomed);
    var key = row['Partner Name'] + row.Lat + row.Lng;
    UQL.pef.closeAllWindows();
    UQL.pef.infoWindows[key].open(UQL.pef.map, UQL.pef.markers[key]);
  }
};

/**
 * Close all pop up windows
 */
UQL.pef.closeAllWindows = function () {
  for (var key in UQL.pef.infoWindows) {
    if (UQL.pef.infoWindows.hasOwnProperty(key)) {
      UQL.pef.infoWindows[key].close();
    }
  }
};

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * @param dataTable
 */
UQL.pef.drawDataTable = function (dataTable) {
  var options = {};

  var displayDataView = new google.visualization.DataView(dataTable);

  var hideColumnIndexes = [];
  for (var c = 0, l = displayDataView.getNumberOfColumns(); c < l; c++) {
    var columnName = UQL.pef.dataTable.getColumnLabel(c);
    if (UQL.pef.hideColumns.indexOf(columnName) !== -1) {
      hideColumnIndexes.push(c);
    }
  }

  displayDataView.hideColumns(hideColumnIndexes);

  UQL.pef.chart = new google.visualization.Table(document.getElementById('pef-data-table'));
  UQL.pef.chart.draw(displayDataView, options);
  google.visualization.events.addListener(UQL.pef.chart, 'select', UQL.pef.rowSelectFunction);
};


// go ...
google.load('visualization', '1', {packages: ['table']});
google.maps.event.addDomListener(window, 'load', UQL.pef.loadVisualisations);

/*
 * jQuery function to reset map
 */
$('#reset-map').click(function () {
  var pos = new google.maps.LatLng(UQL.pef.mapCentre.lat, UQL.pef.mapCentre.lng);
  UQL.pef.map.setCenter(pos);
  UQL.pef.map.setZoom(UQL.pef.mapZoom);
});


