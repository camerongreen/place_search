/**
 * Visualisation to display CEF statistics globally
 *
 * @author  Cameron Green <cam@uq.edu.au>
 * @date  2014-10-29
 */
// create a quasi namespace
var UQL = UQL || {};

UQL.cefDataTable = null;
UQL.chart = null;
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

  new google.visualization.Query('https://spreadsheets.google.com/tq?key=1-RhbWPKweWTnHClvAclHn2t_4x33Q-gzcmSqBwRTxfY').
    send(UQL.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param response
 */
UQL.drawVisualisations = function (response) {
  UQL.cefDataTable = response.getDataTable();

  UQL.drawRegionsMap(UQL.columns.total);
  UQL.drawDataTable();
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
  var select = UQL.chart.getSelection();
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
 *
 * @param Integer column to display from spreadsheet
 * @param numeric region to display on map
 */
UQL.drawRegionsMap = function (column, region) {
  var options = {};
  if (typeof region !== 'undefined') {
    options.region = region;
  }
  var editedDataTable = UQL.cefDataTable.clone();
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
 * Globals:
 *   UQL.cefDataTable
 */
UQL.drawDataTable = function () {
  var options = {};

  var chart = new google.visualization.Table(document.getElementById('data-table'));

  chart.draw(UQL.cefDataTable, options);
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
    UQL.drawRegionsMap(column, region)
  } else {
    UQL.drawRegionsMap(column)
  }
});


