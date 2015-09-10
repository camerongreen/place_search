/**
 * Visualisation to display PEF statistics globally
 *
 * @author  Cameron Green <i@camerongreen.org>
 * @date  2015-09-10
 */
// create a quasi namespace
var PBF = PBF || {};

PBF.ps = {
  dataTable: null,
  map: null,
  chart: null,
  spreadsheet: 'https://spreadsheets.google.com/tq?key=1z-Y4EWAlkFcKZNdAHIaXvyH3MtVvYT1JnusnVEAnLew',
  markerImage: 'images/mm_20_white.png',
  mapZoom: 3,
  mapZoomed: 7,
  lineColour: '#FFFFFF',
  lineOpacity: .5,
  hideColumns: [
    'Lat',
    'Lng',
    'Geocoded address',
    'Geocode result'
  ],
  mapCentre: {
    lat: 2,
    lng: 135
  },
  markers: [],
  infoWindows: []
};

/**
 * Loads a google spreadsheet
 */
PBF.ps.loadVisualisations = function () {
  new google.visualization.Query(PBF.ps.spreadsheet).send(PBF.ps.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param response
 */
PBF.ps.drawVisualisations = function (response) {
  PBF.ps.dataTable = response.getDataTable();

  $('#ps-loader').hide();
  PBF.ps.drawMap();
  PBF.ps.drawDataTable(PBF.ps.dataTable);
  PBF.ps.drawPlacemarks(PBF.ps.map, PBF.ps.dataTable);
  PBF.ps.fitBounds();
};

/**
 * Draws markers on the map representing the passed in data
 *
 * @param {Object}  map
 * @param {Object}  dataTable
 */
PBF.ps.drawPlacemarks = function (map, dataTable) {
  for (var r = 0, nr = dataTable.getNumberOfRows(); r < nr; r++) {
    var row = PBF.ps.getRow(dataTable, r);
    PBF.ps.addPlacemark(map, row.Lat, row.Lng, row.Name, null, row);
  }
};

/**
 * gets a Row into an object for easier use
 */
PBF.ps.getRow = function (dataTable, rowNum) {
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
 /**
 * Add a placemark to the map
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
 *
 * Globals:
 *   PBF.ps.dataTable
 */
PBF.ps.drawMap = function () {
  var styles = [
    {
      featureType: "road",
      stylers: [
        {visibility: "off"}
      ]
    },
    {
      featureType: "administrative.country",
      elementType: "geometry.stroke",
      stylers: [
        {color: "#ffffff"},
        {saturation: -100},
        {lightness: 100}
      ]
    },
    {
      featureType: "administrative.neighborhood",
      stylers: [
        {visibility: "off"}
      ]
    },
    {
      featureType: "administrative.land_parcel",
      stylers: [
        {visibility: "off"}
      ]
    }
  ];

  var mapOptions = {
    center: {lat: PBF.ps.mapCentre.lat, lng: PBF.ps.mapCentre.lng},
    zoom: PBF.ps.mapZoom,
    minZoom: 2,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: styles
  };
  PBF.ps.map = new google.maps.Map(document.getElementById('ps-map'), mapOptions);
};

/**
 * Allow user to click on table and zoom map
 */
PBF.ps.rowSelectFunction = function () {
  var select = PBF.ps.chart.getSelection();
  if (select.length > 0) {
    var row = PBF.ps.getRow(PBF.ps.dataTable, select[0].row);
    var pos = new google.maps.LatLng(row.Lat, row.Lng);
    PBF.ps.map.setCenter(pos);
    PBF.ps.map.setZoom(PBF.ps.mapZoomed);
    var key = row['Partner Name'] + row.Lat + row.Lng;
    PBF.ps.closeAllWindows();
    PBF.ps.infoWindows[key].open(PBF.ps.map, PBF.ps.markers[key]);
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
 * @param dataTable
 */
PBF.ps.drawDataTable = function (dataTable) {
  var options = {};

  var displayDataView = new google.visualization.DataView(dataTable);

  var hideColumnIndexes = [];
  for (var c = 0, l = displayDataView.getNumberOfColumns(); c < l; c++) {
    var columnName = PBF.ps.dataTable.getColumnLabel(c);
    if (PBF.ps.hideColumns.indexOf(columnName) !== -1) {
      hideColumnIndexes.push(c);
    }
  }

  displayDataView.hideColumns(hideColumnIndexes);

  PBF.ps.chart = new google.visualization.Table(document.getElementById('ps-data-table'));
  PBF.ps.chart.draw(displayDataView, options);
  google.visualization.events.addListener(PBF.ps.chart, 'select', PBF.ps.rowSelectFunction);
};

PBF.ps.fitBounds = function () {
  var bounds = new google.maps.LatLngBounds();
  for (i = 0; i < PBF.ps.markers.length; i++) {
    bounds.extend(PBF.ps.markers[i].getPosition());
  }

  PBF.ps.map.fitBounds(bounds);
};


// go ...
google.load('visualization', '1', {packages: ['table']});
google.maps.event.addDomListener(window, 'load', PBF.ps.loadVisualisations);

/*
 * jQuery function to reset map
 */
$('#reset-map').click(function () {
  PBF.ps.fitBounds();
});


