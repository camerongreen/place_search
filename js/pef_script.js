/**
 * Visualisation to display CEF statistics globally
 *
 * @author  Cameron Green <cam@uq.edu.au>
 * @date  2014-10-29
 */
google.load("visualization", "1", {packages: ["geochart", "table"]});
google.setOnLoadCallback(loadVisualisations);

var cefDataTable;

/**
 * Loads a google spreadsheet
 */
function loadVisualisations() {
  new google.visualization.Query('https://spreadsheets.google.com/tq?key=1-RhbWPKweWTnHClvAclHn2t_4x33Q-gzcmSqBwRTxfY').
    send(drawVisualisations);
}

/**
 * Callback to take the loaded spreadsheet, pull the data table
 * and initialise the visualisations
 *
 * @param response
 */
function drawVisualisations(response) {
  cefDataTable = response.getDataTable();

  drawRegionsMap(9);
  drawDataTable();
}

/**
 * Shows a google GeoChart visualisation to the '#map' html element
 *
 * Globals:
 *   cefDataTable
 *
 * @param Integer column to display from spreadsheet
 * @param numeric region to display on map
 */
function drawRegionsMap(column, region) {
  var options = {
    magnifyingGlass: {
      enable: true,
      zoomFactor: 5.0
    },
    legend: 'none'
  };
  if (typeof region !== 'undefined') {
    options.region = region;
  }
  var editedDataTable = cefDataTable.clone();
  var numColumns = 10;

  for (var i = numColumns - 1; i > 0; i--) {
    if (i !== column) {
      editedDataTable.removeColumn(i);
    }
  }

  var chart = new google.visualization.GeoChart(document.getElementById('map'));

  chart.draw(editedDataTable, options)
}

/**
 * Shows a google Table visualisation to the '#data-table' html element
 *
 * Globals:
 *   cefDataTable
 */
function drawDataTable() {
  var options = {};

  var chart = new google.visualization.Table(document.getElementById('data-table'));

  chart.draw(cefDataTable, options);
}

/*
 * jQuery function to allow selection of region and data type
 */
$('#show-map').click(function () {
  var column = parseInt($("#column").val(), 10);
  var region = $("#region").val();

  if (parseInt(region, 10) !== 0) {
    drawRegionsMap(column, region)
  } else {
    drawRegionsMap(column)
  }
});


