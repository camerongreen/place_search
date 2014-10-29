/**
 * Visualisation to display CEF statistics globally
 *
 * @author  Cameron Green <cam@uq.edu.au>
 * @date  2014-10-29
 */
// create a quasi namespace
var UQL = UQL || {};

UQL.cefDataTable = null;
UQL.map = null;
UQL.spreadSheet = 'https://spreadsheets.google.com/tq?key=1eQqryMh3q6OwIMKfT5VPkLXvYJEFyPt4klwuVoUTpBA';
UQL.columns = {
  partner: 0,
  city: 1,
  country: 2,
  region: 3,
  students: 4,
  publications: 5,
  collaborations: 6,
  staff: 7,
  address: 8,
  lat: 9,
  lng: 10
};

UQL.address = {
  lat: -27.497516,
  lng: 153.013206,
  org: 'The University of Queensland, St Lucia',
  country: 'Australia'
};

/**
 * Loads a google spreadsheet
 */
UQL.loadVisualisations = function () {
  var mapOptions = {
    center: {lat: UQL.address.lat, lng: UQL.address.lng},
    zoom: 8
  };
  UQL.map = new google.maps.Map(document.getElementById('map'), mapOptions);

  new google.visualization.Query(UQL.spreadSheet).send(UQL.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param response
 */
UQL.drawVisualisations = function (response) {
  UQL.cefDataTable = response.getDataTable();

  UQL.cefDataTable.removeColumn(UQL.columns.address);

  UQL.drawMap();
  UQL.drawDataTable();
  UQL.drawToolbar();
};

/**
 * Draw the toolbar
 */
UQL.drawToolbar = function() {
  var components = [
    {type: 'html', datasource: UQL.spreadSheet},
    {type: 'csv', datasource: UQL.spreadSheet}
  ];

  var container = document.getElementById('toolbar-div');
  google.visualization.drawToolbar(container, components);

  // dodgy hacks to make it look bootstrappy
  $('#toolbar-div > span > div').removeClass('charts-menu-button').addClass('form-control').addClass('btn').addClass('btn-success');
  $('#toolbar-div div').removeClass('button-inner-box').removeClass('charts-menu-button-inner-box').removeClass('charts-menu-button-outer-box');
  $('#toolbar-div > span span').html('Export data');
};

/**
 * Called when user clicks on country
 *
 * @param {Object}
 */
UQL.showCountryInfo = function (eventData) {
  var countryInfo = UQL.getCountryInfo(eventData.region);
  var ignoreColumns = ['Country'];
  var display = '<table>';
  //display += '<tr><th>Metric</th><th>&nbsp;</th><th>Value</th></tr>';
  for (var i in countryInfo) {
    if (countryInfo.hasOwnProperty(i) && (ignoreColumns.indexOf(i) === -1)) {
      display += '<tr>';
      display += '<td>' + i + ' : </td><td>&nbsp;</td><td>' + countryInfo[i] + '</td>'
      display += '</tr>';
    }
  }
  display += '</table>';

  var newDiv = $('<div>');
  newDiv.html(display);
  newDiv.dialog({
    minWidth: 400,
    title: countryInfo.Country
  });
};

/**
 * Function to retrieve information about a country given its name
 */
UQL.getCountryInfo = function () {
  var select = UQL.map.getSelection();
  var data = {};
  if (select.length > 0) {
    for (var i = 0, l = UQL.cefDataTable.getNumberOfColumns(); i < l; i++) {
      data[UQL.cefDataTable.getColumnLabel(i)] = UQL.cefDataTable.getValue(select[0].row, i);
    }
  }
  return data;
};

/**
 * Shows a google GeoChart visualisation to the '#map' html element
 *
 * Globals:
 *   UQL.cefDataTable
 */
UQL.drawMap = function () {
};

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * Globals:
 *   UQL.cefDataTable
 */
UQL.drawDataTable = function () {
  var options = {};

  var chart = new google.visualization.Table(document.getElementById('data-table'));

  chart.draw(UQL.cefDataTable, options);
};

// go ...
google.load("visualization", "1", {packages: ["table"]});
google.maps.event.addDomListener(window, 'load', UQL.loadVisualisations);

/*
 * jQuery function to allow moving between elements
 */


