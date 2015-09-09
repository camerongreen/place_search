/**
 *
 * User: Cameron Green <i@camerongreen.org>
 * Date: 9/09/15
 * Time: 8:05 PM
 */

// main sheet we are working with
var spreadsheet;

// Set up column names well use
var addressColumnsHeadings = [
  'Street',
  'Suburb',
  'State',
  'Postcode'
];

var geoColumnHeading = 'Geocoded address';
var geoResultColumnHeading = 'Geocoded result';
var latColumnHeading = 'Lat';
var lngColumnHeading = 'Lng';

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
 * Get the heading row
 *
 * @param {Object} sheet
 */
function getHeadings(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var firstRowValues = firstRow.getValues();
  return firstRowValues[0];
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
    if (values[addressColumns[i]].trim() !== '') {
      returnVal.push(values[addressColumns[i]]);
    }
  }
  return returnVal.join(', ');
}


function geocodeAddresses() {
  var geocoder = Maps.newGeocoder();
  var location;
  var sheet = getFirstSheet(spreadsheet);
  var end = sheet.getLastRow();
  var headings = getHeadings(sheet);
  var geoColumn = getColumnIndex(headings, geoColumnHeading);
  var geoResultColumn = getColumnIndex(headings, geoResultColumnHeading);
  var latColumn = getColumnIndex(headings, latColumnHeading);
  var lngColumn = getColumnIndex(headings, lngColumnHeading);

  var addressColumns = [
    getColumnIndex(headings, addressColumnsHeadings.Street),
    getColumnIndex(headings, addressColumnsHeadings.Town),
    getColumnIndex(headings, addressColumnsHeadings.Postcode)
  ];

  // skip first row as headings
  for (var i = 2; i <= end; i++) {
    var row = spreadsheet.getRange(i, 1, 1, sheet.getLastColumn());
    var rowValues = row.getValues();

    var address = makeAddress(addressColumns, rowValues);

    cells.getCell(i, geoColumn).setValue(address);

    location = geocoder.geocode(address);
    cells.getCell(i, geoResultColumn).setValue(location.status);

    // if we get OK then set the lat lng values
    if (location.status === 'OK') {
      var lat = location.results[0].geometry.location.lat;
      var lng = location.results[0].geometry.location.lng;

      cells.getCell(i, latColumn).setValue(lat);
      cells.getCell(i, lngColumn).setValue(lng);
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
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name: "Geocode columns",
    functionName: "geocodeAddresses"
  }];
  spreadsheet.addMenu("Macros", entries);
};