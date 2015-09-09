/* global getSheets */
/**
 *
 * User: Cameron Green <i@camerongreen.org>
 * Date: 9/9/15
 * Time: 8:05 PM
 */

var headingRow = 1;

// Set up column names we'll use
var columnHeadings = {
  street: 'Street',
  suburb: 'Suburb',
  state: 'State',
  postcode: 'Postcode',
  geo: 'Geocoded address',
  geoResult: 'Geocode result',
  lat: 'Lat',
  lng: 'Lng'
};

/**
 * Given a row, return the index of the column with the
 * given text value
 *
 * @param {string[]} headings
 * @param {string} searchText
 */
function getColumnIndex(headings, searchText) {
  return headings.indexOf(searchText) + 1;
}

/**
 * Get the first sheet in the spreadsheet
 *
 * @param {Object} sheet
 */
function getFirstSheet(sheet) {
  return sheet.getSheets()[0];
}


/**
 * Make an address from the row values
 *
 * @param {string[]} addressColumns
 * @param {string[]} values
 */
function makeAddress(addressColumns, values) {
  var returnVal = [];
  for (var i = 0, l = addressColumns.length; i < l; i++) {
    var value = values[addressColumns[i]] + '';
    if (value.trim() !== '') {
      returnVal.push(values[addressColumns[i] - 1]);
    }
  }
  return returnVal.join(', ');
}

/**
 * Get row values as strings
 *
 * @param {Object} sheet
 * @param {integer} row Row to get
 * @param {integer} columns Number of columns
 */
function getRow(sheet, row, columns) {
  var row = sheet.getRange(row, 1, 1, columns);
  var rowValues = row.getValues()[0];
  var returnVal = [];
  for (var i = 0, l = rowValues.length; i < l; i++) {
    returnVal.push(rowValues[i] + '');
  }
  return returnVal;
}

/**
 * Get column indexes
 *
 * @param {Object} headings
 * @param {Object} columnHeadings
 */
function getColumnIndexes(headings, columnHeadings) {
  var returnVal = {};
  for (var heading in columnHeadings) {
    if (columnHeadings.hasOwnProperty(heading)) {
      returnVal[heading] = getColumnIndex(headings, columnHeadings[heading]);
    }
  }
  return returnVal;
}

/**
 * Main function, gets active spreadsheet and geocodes all the rows
 * it can find, assumes the first is column headers
 */
function geocodeAddresses() {
  var geocoder = Maps.newGeocoder();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getFirstSheet(spreadsheet);
  var rowEnd = sheet.getLastRow();
  var columnEnd = sheet.getLastColumn();
  var headings = getRow(sheet, headingRow, columnEnd);
  var column = getColumnIndexes(headings, columnHeadings);

  var addressColumns = [
    column.street,
    column.suburb,
    column.state,
    column.postcode
  ];

  // skip rows up to headings
  for (var i = headingRow + 1; i <= rowEnd; i++) {
    var row = getRow(sheet, i, columnEnd);
    var address = makeAddress(addressColumns, row);
    sheet.getRange(i, column.geo).setValue(address);
    var location = geocoder.geocode(address);
    sheet.getRange(i, column.geoResult).setValue(location.status);

    // if we get OK then set the lat lng values
    if (location.status === 'OK') {
      var lat = location.results[0].geometry.location.lat;
      var lng = location.results[0].geometry.location.lng;

      sheet.getRange(i, column.lat).setValue(lat);
      sheet.getRange(i, column.lng).setValue(lng);
    }
  }
}

/**
 * Adds a custom menu to the active spreadsheet, containing a single menu item.
 *
 * The onOpen() function, when defined, is automatically invoked whenever the
 * spreadsheet is opened.
 *
 * For more information on using the Spreadsheet API, see
 * https://developers.google.com/apps-script/service_spreadsheet
 */
function onOpen() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name: "Geocode columns",
    functionName: "geocodeAddresses"
  }];
  spreadsheet.addMenu("Macros", entries);
}