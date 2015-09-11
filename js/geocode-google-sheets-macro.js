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
  brands: 'Brands',
  postcode: 'Postcode',
  geo: 'Geocoded address',
  geoResult: 'Geocode result',
  date: 'Geocoding date',
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
    var value = getRowColumn(values, addressColumns[i]) + '';
    if (value.trim() !== '') {
      returnVal.push(value);
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
    returnVal.push((rowValues[i] + '').trim());
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
 * Get row column
 *
 * Columns in spreadsheets start at 1, whereas in our array
 * they start at zero, so make adjustment of - 1 to column index
 *
 * @param {mixed[]} row
 * @param {mixed} value
 */
function getRowColumn(row, column) {
  return row[column - 1];
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

    // only geocode columns without coordinates
    if (getRowColumn(row, column.lat) === '') {
      var address = makeAddress(addressColumns, row);
      sheet.getRange(i, column.geo).setValue(address);
      var location = geocoder.geocode(address);
      sheet.getRange(i, column.geoResult).setValue(location.status);
      sheet.getRange(i, column.date).setValue((new Date()).toLocaleString());

      // if we get OK then set the lat lng values
      if (location.status === 'OK') {
        var lat = location.results[0].geometry.location.lat;
        var lng = location.results[0].geometry.location.lng;

        sheet.getRange(i, column.lat).setValue(lat);
        sheet.getRange(i, column.lng).setValue(lng);
      }
    }
  }
}

/**
 * Main function, takes the comma seperated brands
 * array and orders it alphabetically
 */
function orderBrands() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getFirstSheet(spreadsheet);
  var rowEnd = sheet.getLastRow();
  var columnEnd = sheet.getLastColumn();
  var headings = getRow(sheet, headingRow, columnEnd);
  var column = getColumnIndexes(headings, columnHeadings);

  // skip rows up to headings
  for (var i = headingRow + 1; i <= rowEnd; i++) {
    var row = getRow(sheet, i, columnEnd);
    var brand = getRowColumn(row, column.brands);
    var brands = brand.split(/\s*,\s*/);
    brands.sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    sheet.getRange(i, column.brands).setValue(brands.join(', '));
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
  },{
    name: "Order brands",
    functionName: "orderBrands"
  }];
  spreadsheet.addMenu("Macros", entries);
}