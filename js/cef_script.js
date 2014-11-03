/*global google */
/**
 * Visualisation to display CEF statistics globally
 *
 * @author  Cameron Green <cam@uq.edu.au>
 * @date  2014-10-29
 */

// create a quasi namespace
var UQL = UQL || {};

// have to use globals in callbacks
UQL.cefDataTable = null;
UQL.chart = null;
UQL.spreadSheet = 'https://spreadsheets.google.com/tq?key=1-RhbWPKweWTnHClvAclHn2t_4x33Q-gzcmSqBwRTxfY';
UQL.columns = {
  country: 0,
  region: 1,
  year: 2,
  students: 3,
  publications: 4,
  grant: 5,
  collaborations: 6,
  alumni: 7,
  agreements: 8,
  total: 9
};

/**
 * Loads a google spreadsheet
 */
UQL.loadVisualisations = function () {
  UQL.chart = new google.visualization.GeoChart(document.getElementById('map'));
  google.visualization.events.addListener(UQL.chart, 'select', UQL.showCountryInfo);

  new google.visualization.Query(UQL.spreadSheet).send(UQL.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param {Object} response
 */
UQL.drawVisualisations = function (response) {
  UQL.cefDataTable = response.getDataTable();

  UQL.drawRegionsMap(UQL.cefDataTable, UQL.columns.total);
  UQL.drawDataTable(UQL.cefDataTable);
  UQL.drawToolbar(UQL.spreadSheet);
};

/**
 * Called when user clicks on country
 */
UQL.showCountryInfo = function () {
  var countryInfo = UQL.getCountryInfo(UQL.cefDataTable);
  var ignoreColumns = ['Country', 'Region'];
  var display = '<table>';
  //display += '<tr><th>Metric</th><th>&nbsp;</th><th>Value</th></tr>';
  for (var i in countryInfo) {
    if (countryInfo.hasOwnProperty(i) && (ignoreColumns.indexOf(i) === -1)) {
      display += '<tr>';
      display += '<td>' + i + ' : </td><td>&nbsp;</td><td>' + countryInfo[i].toLocaleString() + '</td>'
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
 *
 * @param {Object}  dataTable
 */
UQL.getCountryInfo = function (dataTable) {
  var select = UQL.chart.getSelection();
  var data = {};
  if (select.length > 0) {
    for (var i = 0, l = dataTable.getNumberOfColumns(); i < l; i++) {
      data[dataTable.getColumnLabel(i)] = dataTable.getValue(select[0].row, i);
    }
  }
  return data;
};

/**
 * Shows a google GeoChart visualisation to the '#map' html element
 *
 * @param {Object} dataTable
 * @param Integer column to display from spreadsheet
 * @param numeric region to display on map
 */
UQL.drawRegionsMap = function (dataTable, column, region) {
  var options = {};
  if (typeof region !== 'undefined') {
    options.region = region;
  }
  var editedDataTable = dataTable.clone();
  var numColumns = 10;

  for (var i = numColumns - 1; i > 0; i--) {
    if (i !== column) {
      editedDataTable.removeColumn(i);
    }
  }

  UQL.chart.draw(editedDataTable, options)
};

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * @param {Object} dataTable
 */
UQL.drawDataTable = function (dataTable) {
  var options = {};

  var chart = new google.visualization.Table(document.getElementById('data-table'));

  chart.draw(dataTable, options);
};

/**
 * Draw the toolbar
 *
 * @param {String}  spreadSheet
 */
UQL.drawToolbar = function() {
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

// go ...
google.load("visualization", "1", {packages: ["geochart", "table"]});
google.setOnLoadCallback(UQL.loadVisualisations);

/*
 * jQuery function to allow selection of region and data type
 */
$('#show-map').click(function () {
  var column = parseInt($("#column").val(), 10);
  var region = $("#region").val();

  if (parseInt(region, 10) !== 0) {
    UQL.drawRegionsMap(UQL.cefDataTable, column, region)
  } else {
    UQL.drawRegionsMap(UQL.cefDataTable, column)
  }
});


