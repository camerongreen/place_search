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
UQL.cef = {
  dataTable: null,
  chart: null,
  colors: ['FFCCFF', '60227C'],
  spreadSheet: 'https://spreadsheets.google.com/tq?key=1-RhbWPKweWTnHClvAclHn2t_4x33Q-gzcmSqBwRTxfY',
  columns: {
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
  }
};

/**
 * Loads a google spreadsheet
 */
UQL.cef.loadVisualisations = function () {
  $('#cef-loader').hide();
  UQL.cef.chart = new google.visualization.GeoChart(document.getElementById('cef-map'));
  google.visualization.events.addListener(UQL.cef.chart, 'select', UQL.cef.showCountryInfo);

  new google.visualization.Query(UQL.cef.spreadSheet).send(UQL.cef.drawVisualisations);
};

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param {Object} response
 */
UQL.cef.drawVisualisations = function (response) {
  UQL.cef.dataTable = response.getDataTable();

  UQL.cef.drawRegionsMap(UQL.cef.dataTable, UQL.cef.columns.total);
  UQL.cef.drawDataTable(UQL.cef.dataTable);
  UQL.cef.drawToolbar(UQL.cef.spreadSheet);
};

/**
 * Called when user clicks on country
 */
UQL.cef.showCountryInfo = function () {
  var display = UQL.cef.getCountryInfo(UQL.cef.dataTable);
  if (typeof display.Country !== 'undefined') {
    var content = '<table class="table cef-info-window-content" role="table">';
    //content += '<tr><th>Metric</th><th>&nbsp;</th><th>Value</th></tr>';
    if (display.hasOwnProperty('Year')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-calendar"></i></span> Year</td><td>' + display.Year + '</td></tr>';
    }
    if (display.hasOwnProperty('Students')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Students</td><td>' + display.Students + '</td></tr>';
    }
    if (display.hasOwnProperty('Alumni')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Alumni</td><td>' + display.Alumni + '</td></tr>';
    }
    if (display.hasOwnProperty('Grant $')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-usd"></i></span> Grant</td><td>$' + display['Grant $'] + '</td></tr>';
    }
    if (display.hasOwnProperty('Publications')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-book"></i></span> Publications</td><td>' + display.Publications + '</td></tr>';
    }
    if (display.hasOwnProperty('Collaborations')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-transfer"></i></span> Collaborations</td><td>' + display.Collaborations + '</td></tr>';
    }
    if (display.hasOwnProperty('Agreements')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-thumbs-up"></i></span> Agreements</td><td>' + display.Agreements + '</td></tr>';
    }
    if (display.hasOwnProperty('Total')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-plus-sign"></i></span> Total</td><td>' + display.Total + '</td></tr>';
    }
    content += '</table>';

    var newDiv = $('<div>');
    newDiv.html(content);
    newDiv.dialog({
      minWidth: 400,
      title: display.Country
    });
  }
};

/**
 * Function to retrieve information about a country given its name
 *
 * @param {Object}  dataTable
 */
UQL.cef.getCountryInfo = function (dataTable) {
  var select = UQL.cef.chart.getSelection();
  var data = {};
  if (select.length > 0) {
    for (var i = 0, l = dataTable.getNumberOfColumns(); i < l; i++) {
      var columnValue = dataTable.getValue(select[0].row, i);
      var columnName = dataTable.getColumnLabel(i);

      if (columnName === 'Year') {
        data[columnName] = columnValue;
      } else {
        data[columnName] = columnValue.toLocaleString();
      }
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
UQL.cef.drawRegionsMap = function (dataTable, column, region) {
  var options = {
    colorAxis: {colors: UQL.cef.colors},
    datalessRegionColor: 'FFF'
  };
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

  UQL.cef.chart.draw(editedDataTable, options)
};

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * @param {Object} dataTable
 */
UQL.cef.drawDataTable = function (dataTable) {
  var options = {};

  var chart = new google.visualization.Table(document.getElementById('cef-data-table'));

  chart.draw(dataTable, options);
};

/**
 * Draw the toolbar
 *
 * @param {String}  spreadSheet
 */
UQL.cef.drawToolbar = function (spreadSheet) {
  var components = [
    {type: 'html', datasource: spreadSheet},
    {type: 'csv', datasource: spreadSheet}
  ];

  var container = document.getElementById('cef-toolbar-div');
  google.visualization.drawToolbar(container, components);

  // dodgy hacks to make it look bootstrappy
  $('#cef-toolbar-div > span > div').removeClass('charts-menu-button').addClass('form-control').addClass('btn').addClass('btn-success');
  $('#cef-toolbar-div div').removeClass('button-inner-box').removeClass('charts-menu-button-inner-box').removeClass('charts-menu-button-outer-box');
  $('#cef-toolbar-div > span span').html('Export data');
};

// go ...
google.load("visualization", "1", {packages: ["geochart", "table"]});
google.setOnLoadCallback(UQL.cef.loadVisualisations);

/*
 * jQuery function to allow selection of region and data type
 */
$('#show-map').click(function () {
  var column = parseInt($("#column").val(), 10);
  var region = $("#region").val();

  if (parseInt(region, 10) !== 0) {
    UQL.cef.drawRegionsMap(UQL.cef.dataTable, column, region)
  } else {
    UQL.cef.drawRegionsMap(UQL.cef.dataTable, column)
  }
});


