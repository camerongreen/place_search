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
  mapLink: 'http://www.mis.admin.uq.edu.au/Content/Dashboards/CountryEngagementFramework/CEF.swf',
  spreadSheet: 'https://spreadsheets.google.com/tq?key=1K4Bmd3HDPVmuGneSeEUz-hWHI5XcXY-lykkTEgC8jT0',
  reports: {
    Alumni: 'https://advancement.uq.edu.au/advancement-services/reporting',
    Publications: 'https://mis-xi-web.mis.admin.uq.edu.au/OpenDocument/opendoc/openDocument.jsp?sIDType=CUID&iDocID=AYkDz1YeHkVPpxKtMsUHOik',
    'Grant Funding': 'https://mis-xi-web.mis.admin.uq.edu.au/OpenDocument/opendoc/openDocument.jsp?sIDType=CUID&iDocID=ATv.C3I2ZG9Innb3Y4NNH.o',
    Collaborations: 'https://mis-xi-web.mis.admin.uq.edu.au/OpenDocument/opendoc/openDocument.jsp?sIDType=CUID&iDocID=AXG5BJIm77VNuUfSY72mrVI',
    Agreements: 'https://mis-xi-web.mis.admin.uq.edu.au/OpenDocument/opendoc/openDocument.jsp?sIDType=CUID&iDocID=ASNeY_aYLRZMiEQKsCJKzY4',
    Students: 'https://mis-xi-web.mis.admin.uq.edu.au/OpenDocument/opendoc/openDocument.jsp?sIDType=CUID&iDocID=ARa8bwifMdtFk3aWAcoGbKY'
  },
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
    content += '<tr><th>Metric</th><th>Value</th><th>Report</th></tr>';
    if (display.hasOwnProperty('Year')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-calendar"></i></span> Year</td><td>' + display.Year + '</td><td>&nbsp;</td></tr>';
    }
    if (display.hasOwnProperty('Students')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Students</td><td>' + display.Students + '</td><td><a href="' + UQL.cef.reports.Students + '" target="_blank">View</a></td></tr>';
    }
    if (display.hasOwnProperty('Alumni')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-user"></i></span> Alumni</td><td>' + display.Alumni + '</td><td><a href="' + UQL.cef.reports.Alumni + '" target="_blank">View</a></td></tr>';
    }
    if (display.hasOwnProperty('Grant $')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-usd"></i></span> Grant</td><td>$' + display['Grant $'] + '</td><td><a href="' + UQL.cef.reports['Grant Funding'] + '" target="_blank">View</a></td></tr>';
    }
    if (display.hasOwnProperty('Publications')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-book"></i></span> Publications</td><td>' + display.Publications + '</td><td><a href="' + UQL.cef.reports.Publications + '" target="_blank">View</a></td></tr>';
    }
    if (display.hasOwnProperty('Collaborations')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-transfer"></i></span> Collaborations</td><td>' + display.Collaborations + '</td><td><a href="' + UQL.cef.reports.Collaborations + '" target="_blank">View</a></td></tr>';
    }
    if (display.hasOwnProperty('Agreements')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-thumbs-up"></i></span> Agreements</td><td>' + display.Agreements + '</td><td><a href="' + UQL.cef.reports.Agreements + '" target="_blank">View</a></td></tr>';
    }
    if (display.hasOwnProperty('Total')) {
      content += '<tr><td><span><i class="glyphicon glyphicon-plus-sign"></i></span> Total</td><td>' + display.Total + '</td><td>&nbsp;</td></tr>';
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
 * @param {*} year year to display
 * @param {Number} column to display from spreadsheet
 * @param {Number} region to display on map
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
    {column: UQL.cef.columns.year, value: parseInt(year, 10)}
    ]);
  UQL.cef.dataView.setRows(rows);

  var mapDataView = new google.visualization.DataView(UQL.cef.dataView);
  var mapRows = mapDataView.getFilteredRows([
    {column: column, minValue: 0}
    ]);
  mapDataView.setRows(mapRows);

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

  // dodgy hacks to make it look bootstrap-y
  var cefToolbar = $('#cef-toolbar-div');
  $('> span > div', cefToolbar).removeClass('charts-menu-button').addClass('form-control').addClass('btn').addClass('btn-success');
  $('div', cefToolbar).removeClass('button-inner-box').removeClass('charts-menu-button-inner-box').removeClass('charts-menu-button-outer-box');
  $('> span span', cefToolbar).html('Export data');
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
    UQL.cef.drawRegionsMap(UQL.cef.dataTable, year, column, region);
    UQL.cef.drawDataView(UQL.cef.dataView);
  } else {
    UQL.cef.drawRegionsMap(UQL.cef.dataTable, year, column);
    UQL.cef.drawDataView(UQL.cef.dataView);
  }
});


/*
 * jQuery function to go to cef map
 */
$('#go-to-cef-map').click(function () {
  window.open(UQL.cef.mapLink);
});
