/**
 * Visualisation to display PEF statistics globally
 *
 * @author  Cameron Green <cam@uq.edu.au>
 * @date  2014-10-29
 */
// create a quasi namespace
var PBF = PBF || {};

PBF.pef = {
  dataTable: null,
  map: null,
  chart: null,
  spreadSheet: 'https://spreadsheets.google.com/tq?key=1gKxL8oZbjBRmNTJpFLnVWhrAqVLr98PBSv4dDn4hx7A',
  markerImage: 'images/mm_20_white.png',
  mapZoom: 3,
  mapZoomed: 7,
  lineColour: '#FFFFFF',
  lineOpacity: .5,
  hideColumns: [
    'Lat',
    'Lng',
    'Geo Address'
  ],
  mapCentre: {
    lat: 2,
    lng: 135
  },
  markers : {},
  infoWindows : {}
};

/**
 * Loads a google spreadsheet
 */
PBF.pef.loadVisualisations = function () {
  new google.visualization.Query(PBF.pef.spreadSheet).send(PBF.pef.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param response
 */
PBF.pef.drawVisualisations = function (response) {
  PBF.pef.dataTable = response.getDataTable();

  $('#pef-loader').hide();
  PBF.pef.drawMap();
  PBF.pef.drawConnections(PBF.pef.map, PBF.pef.dataTable);
  PBF.pef.drawDataTable(PBF.pef.dataTable);
  PBF.pef.drawToolbar(PBF.pef.spreadSheet);
};

/**
 * Draws markers and lines on the map representing the passed in data
 *
 * @param {Object}  map
 * @param {Object}  dataTable
 */
PBF.pef.drawConnections = function (map, dataTable) {
  PBF.pef.addPlacemark(map, PBF.pef.address.lat, PBF.pef.address.lng, PBF.pef.address.title, PBF.pef.address.image, PBF.pef.address.details);

  for (var r = 0, nr = dataTable.getNumberOfRows(); r < nr; r++) {
    var row = PBF.pef.getRow(dataTable, r);
    var scale = .1;
    PBF.pef.drawLine(map, PBF.pef.address.lat, PBF.pef.address.lng, row.Lat, row.Lng, scale);
    PBF.pef.addPlacemark(map, row.Lat, row.Lng, row['Partner Name'], null, row);
  }
};

/**
 * gets a Row into an object for easier use
 */
PBF.pef.getRow = function (dataTable, rowNum) {
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
PBF.pef.addPlacemark = function (map, lat, lng, title, image, display)
{
  var myLatLng = new google.maps.LatLng(lat, lng);
  var icon = new google.maps.MarkerImage(PBF.pef.markerImage);
  var key = title + lat + lng;
  PBF.pef.markers[key] = new google.maps.Marker({
    map: map,
    position: myLatLng,
    title: title,
    icon: icon
  });

  PBF.pef.infoWindows[key] = PBF.pef.makeInfoWindow(title, image, display);

  google.maps.event.addListener(PBF.pef.markers[key], 'click', function () {
    PBF.pef.infoWindows[key].open(map, PBF.pef.markers[key]);
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
PBF.pef.makeInfoWindow = function (title, image, display)
{
  var content = '<div class="pef-info-window-content">';
  if (image !== null) {
    content += '<div class="col-sm-4"><img src="' + image + '" alt="' + title + ' Logo" class="img-responsive img-thumbnail"/></div><div class="col-sm-8">';
  }
  content += '<h4>' + title + '</h4>' + '<table class="table" role="table">';
  content += '<tr><th>Metric</th><th>Value</th><th>Report</th></tr>';

  content += '<tr><td><span><i class="glyphicon glyphicon-globe"></i></span> Location</td><td>' + display.City + ', ' + display.Country + '</td><td>&nbsp;</td></tr>';
  if (display.hasOwnProperty('Students')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Students</td><td>' + display.Students + '</td><td><a href="' + PBF.pef.reports.Students + '" target="_blank">View</a></td></tr>'
  }
  if (display.hasOwnProperty('Staff')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Staff</td><td>' + display.Staff + '</td><td><a href="' + PBF.pef.reports.Staff + '" target="_blank">View</a></td></tr>';
  }
  if (display.hasOwnProperty('Publications')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-book"></i></span> Publications</td><td>' + display.Publications + '</td><td><a href="' + PBF.pef.reports.Publications + '" target="_blank">View</a></td></tr>';
  }
  if (display.hasOwnProperty('Collaborations')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-transfer"></i></span> Collaborations</td><td>' + display.Collaborations + '</td><td><a href="' + PBF.pef.reports.Collaborations + '" target="_blank">View</a></td></tr>';
  }
  if (display.hasOwnProperty('Web Address')) {
    content += '<tr><td><span><i class="glyphicon glyphicon-link"></i></span> Website</td><td><a href="' + display['Web Address'] + '" target="_blank">' + display['Web Address'] + '</a></td><td>&nbsp;</td></tr>';
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
PBF.pef.drawLine = function (map, sLat, sLng, eLat, eLng, scale) {
  var line = [
    new google.maps.LatLng(sLat, sLng),
    new google.maps.LatLng(eLat, eLng)
  ];

  new google.maps.Polyline({
    map: map,
    path: line,
    strokeWeight: Math.ceil(scale * 10),
    strokeOpacity: PBF.pef.lineOpacity,
    strokeColor: PBF.pef.lineColour
  });
};


/**
 * Draw the toolbar
 *
 * @param {String}  spreadSheet
 */
PBF.pef.drawToolbar = function (spreadSheet) {
  var components = [
    {type: 'html', datasource: spreadSheet},
    {type: 'csv', datasource: spreadSheet}
  ];

  var container = document.getElementById('pef-toolbar-div');
  google.visualization.drawToolbar(container, components);

  // dodgy hacks to make it look bootstrap-y
  var pefToolbar = $('#pef-toolbar-div');
  $('> span > div', pefToolbar).removeClass('charts-menu-button').addClass('form-control').addClass('btn').addClass('btn-success');
  $('div', pefToolbar).removeClass('button-inner-box').removeClass('charts-menu-button-inner-box').removeClass('charts-menu-button-outer-box');
  $('> span span', pefToolbar).html('Export data');
};


/**
 * Shows a google GeoChart visualisation to the '#map' html element
 *
 * Globals:
 *   PBF.pef.dataTable
 */
PBF.pef.drawMap = function () {
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
    center: {lat: PBF.pef.mapCentre.lat, lng: PBF.pef.mapCentre.lng},
    zoom: PBF.pef.mapZoom,
    minZoom: 2,
    //mapTypeId: google.maps.MapTypeId.SATELLITE
    //mapTypeId: google.maps.MapTypeId.HYBRID,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: styles
  };
  PBF.pef.map = new google.maps.Map(document.getElementById('pef-map'), mapOptions);
};

/**
 * Allow user to click on table and zoom map
 */
PBF.pef.rowSelectFunction = function () {
  var select = PBF.pef.chart.getSelection();
  if (select.length > 0) {
    var row = PBF.pef.getRow(PBF.pef.dataTable, select[0].row);
    var pos = new google.maps.LatLng(row.Lat, row.Lng);
    PBF.pef.map.setCenter(pos);
    PBF.pef.map.setZoom(PBF.pef.mapZoomed);
    var key = row['Partner Name'] + row.Lat + row.Lng;
    PBF.pef.closeAllWindows();
    PBF.pef.infoWindows[key].open(PBF.pef.map, PBF.pef.markers[key]);
  }
};

/**
 * Close all pop up windows
 */
PBF.pef.closeAllWindows = function () {
  for (var key in PBF.pef.infoWindows) {
    if (PBF.pef.infoWindows.hasOwnProperty(key)) {
      PBF.pef.infoWindows[key].close();
    }
  }
};

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * @param dataTable
 */
PBF.pef.drawDataTable = function (dataTable) {
  var options = {};

  var displayDataView = new google.visualization.DataView(dataTable);

  var hideColumnIndexes = [];
  for (var c = 0, l = displayDataView.getNumberOfColumns(); c < l; c++) {
    var columnName = PBF.pef.dataTable.getColumnLabel(c);
    if (PBF.pef.hideColumns.indexOf(columnName) !== -1) {
      hideColumnIndexes.push(c);
    }
  }

  displayDataView.hideColumns(hideColumnIndexes);

  PBF.pef.chart = new google.visualization.Table(document.getElementById('pef-data-table'));
  PBF.pef.chart.draw(displayDataView, options);
  google.visualization.events.addListener(PBF.pef.chart, 'select', PBF.pef.rowSelectFunction);
};


// go ...
google.load('visualization', '1', {packages: ['table']});
google.maps.event.addDomListener(window, 'load', PBF.pef.loadVisualisations);

/*
 * jQuery function to reset map
 */
$('#reset-map').click(function () {
  var pos = new google.maps.LatLng(PBF.pef.mapCentre.lat, PBF.pef.mapCentre.lng);
  PBF.pef.map.setCenter(pos);
  PBF.pef.map.setZoom(PBF.pef.mapZoom);
});


/*
 * jQuery function to go to pef map
 */
$('#go-to-pef-map').click(function () {
  window.open(PBF.pef.mapLink);
});

