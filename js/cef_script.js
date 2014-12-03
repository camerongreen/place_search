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
  dataView: null,
  chart: null,
  chartTable: null,
  colors: ['FFCCFF', '60227C'],
  spreadSheet: 'https://spreadsheets.google.com/tq?key=1K4Bmd3HDPVmuGneSeEUz-hWHI5XcXY-lykkTEgC8jT0',
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
  UQL.cef.chartTable = new google.visualization.Table(document.getElementById('cef-data-table'));

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

  UQL.cef.drawRegionsMap(UQL.cef.dataTable, $('#year').val(), UQL.cef.columns.total);
  UQL.cef.drawDataView(UQL.cef.dataView);
  UQL.cef.drawToolbar(UQL.cef.spreadSheet);
};

/**
 * Called when user clicks on country
 */
UQL.cef.showCountryInfo = function () {
  var display = UQL.cef.getCountryInfo(UQL.cef.dataView);
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
 * Function to retrieve information about a country row
 *
 * @param {Object}  dataView
 */
UQL.cef.getCountryInfo = function (dataView) {
  var select = UQL.cef.chart.getSelection();
  var data = {};
  if (select.length > 0) {
    for (var i = 0, l = dataView.getNumberOfColumns(); i < l; i++) {
      var columnValue = dataView.getValue(select[0].row, i);
      var columnName = dataView.getColumnLabel(i);

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
 * @param Mixed year year to display
 * @param Integer column to display from spreadsheet
 * @param numeric region to display on map
 */
UQL.cef.drawRegionsMap = function (dataTable, year, column, region) {
  var options = {
    colorAxis: {colors: UQL.cef.colors},
    datalessRegionColor: 'FFF'
  };
  if (typeof region !== 'undefined') {
    options.region = region;
  }
  UQL.cef.dataView = new google.visualization.DataView(dataTable);
  var rows = UQL.cef.dataView.getFilteredRows([
    {column: column, minValue: 1},
    {column: UQL.cef.columns.year, value: parseInt(year, 10)}
    ]);
  UQL.cef.dataView.setRows(rows);

  var mapDataView = new google.visualization.DataView(UQL.cef.dataView);
  var numColumns = 10;
  var hideColumns = [];

  // hide every column except for the one we are displaying and the first
  // column which is the country name
  for (var i = numColumns - 1; i > 0; i--) {
    if (i !== column) {
      hideColumns.push(i);
    }
  }
  
  if (hideColumns.length > 0) {
    mapDataView.hideColumns(hideColumns);
  }

  UQL.cef.chart.draw(mapDataView, options)
};

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * @param {Object} dataView
 */
UQL.cef.drawDataView = function (dataView) {
  var options = {};

  UQL.cef.chartTable.draw(dataView, options);
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
  var year = $("#year").val();
  var column = parseInt($("#column").val(), 10);
  var region = $("#region").val();

  if (parseInt(region, 10) !== 0) {
    UQL.cef.drawRegionsMap(UQL.cef.dataTable, year, column, region)
    UQL.cef.drawDataView(UQL.cef.dataView);
  } else {
    UQL.cef.drawRegionsMap(UQL.cef.dataTable, year, column)
    UQL.cef.drawDataView(UQL.cef.dataView);
  }
});


