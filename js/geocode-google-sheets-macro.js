/**
 *
 * User: Cameron Green <i@camerongreen.org>
 * Date: 9/09/15
 * Time: 8:05 PM
 */

// main sheet we are working with
var spreadSheet;

// Set up column names well use
var addressColumnsHeadings = [
  'Street',
  'Town',
  'Postcode'
];

var geoColumnHeading = 'Geocoding Result';
var latColumnHeading = 'Lat';
var lngColumnHeading = 'Lng';

/**
 * Given a row, return the index of the column with the
 * given text value
 *
 * @param {Array[String]} headings
 * @param {String} searchText
 */
function getColumnIndex(headings, searchText) {
  return headings.indexOf(searchText) + 1;
}

/**
 * Get the first sheet in the spreadsheet
 */
function getFirstSheet(sheet) {
  return sheet.getSheets()[0];
}

/**
 * Get the heading row
 */
function getHeadings(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var firstRowValues = firstRow.getValues();
  var headings = firstRowValues[0];
  return headings;
}

/**
 * Make an address from the row values
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
  var end = spreadsheet.getLastRow();
  var headings = getHeadings();
  var geoColumn = getColumnIndex(headings, geoColumnHeading);
  var latColumn = getColumnIndex(headings, latColumnHeading);
  var lngColumn = getColumnIndex(headings, lngColumnHeading);

  var addressColumns = [
    getColumnIndex(addressColumnsHeadings.Street),
    getColumnIndex(addressColumnsHeadings.Town),
    getColumnIndex(addressColumnsHeadings.Postcode)
  ];

  // skip first row as headings
  for (var i = 2; i <= end; i++) {
    var row = spreadsheet.getRange(i, 1, 1, sheet.getLastColumn());
    var rowValues = row.getValues();

    var address = makeAddress(addressColumns, rowValues);

    // Geocode the address and plug the lat, lng pair into the
    // 2nd and 3rd elements of the current range row.
    location = geocoder.geocode(address);
    cells.getCell(i, geoColumn).setValue(address);

    // if we get OK then set the lat lng values
    if (location.status === 'OK') {
      lat = location["results"][0]["geometry"]["location"]["lat"];
      lng = location["results"][0]["geometry"]["location"]["lng"];

      cells.getCell(i, latColumn).setValue(lat);
      cells.getCell(i, lngColumn).setValue(lng);
    } else {
      cells.getCell(i, geoColumn).setValue('Not found - ' + location.status);
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
  spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name: "Geocode columns",
    functionName: "geocodeAddresses"
  }];
  spreadSheet.addMenu("Macros", entries);
};