/**
 * Display places from a spreadsheet onto a google map
 *
 * @author  Cameron Green <i@camerongreen.org>
 * @date  2015-09-10
 */
// create a quasi namespace
var PBF = PBF || {};

(function ($) {
    PBF.ps = {
        dataTable: null,
        map: null,
        chart: null,
        spreadsheet: 'https://spreadsheets.google.com/tq?key=1z-Y4EWAlkFcKZNdAHIaXvyH3MtVvYT1JnusnVEAnLew',
        //postcodesFile: '{{ 'postcodes.json' | asset_url }}',
        //markerImage: '{{ 'mm_20_white.png' | asset_url }}',
        //markerImage: '{{ 'home.png' | asset_url }}',
        postcodesFile: 'js/postcodes.json',
        markerImage: 'images/mm_20_white.png',
        homeImage: 'images/home.png',
        mapZoom: 3,
        mapZoomed: 15,
        brandsStrIgnore: [ // should all be in lower case
            'tbc',
            'please call',
            'please contact store'
        ],
        hideColumns: [
            'Lat',
            'Lng',
            'Postcode',
            'State',
            'Suburb',
            'Km',
            'Geocoded address',
            'Geocoding date',
            'Geocode result'
        ],
        mapCentre: {
            lat: 2,
            lng: 135
        },
        numClosestVenues: 5,
        circumferenceEarth: 40755,
        markers: [],
        infoWindows: [],
        brands: [],
        searchObject: [],
        column: {}
    };

    /**
     * Custom datatable formatter
     */
    var WebsiteFormatter = function (type) {
        this.type = type;
    };

    /**
     * Formats a gviz DataTable column
     * @param {Object} dt DataTable to format
     * @param {Number} column index number
     */
    WebsiteFormatter.prototype.format = function (dt, column) {
        var re = /^[a-zA-Z]+:\/\//;
        for (var i = 0; i < dt.getNumberOfRows(); i++) {
            var value = dt.getValue(i, column);
            if (value !== null) {
                var formattedValue = '';
                if (this.type === 'facebook') {
                    formattedValue += '<i class="icon icon-facebook-sign" aria-hidden="true"></i>';
                } else if (this.type === 'fs') {
                    formattedValue += '<i class="icon icon-food" title="Food service" aria-hidden="true"></i>';
                } else if (this.type === 'shop') {
                    formattedValue += '<i class="icon icon-shopping-cart" title="Shop" aria-hidden="true"></i>';
                } else if (this.type === 'www') {
                    formattedValue += '<i class="icon icon-globe" title="Online" aria-hidden="true"></i>';
                }
                if (value !== 'x') {
                    if (!re.test(value)) {
                        value = 'http://' + value;
                    }
                    formattedValue = '<a href="' + value + '" target="_blank" style="text-decoration: none">' + formattedValue + '</a>';
                }
                dt.setFormattedValue(i, column, formattedValue);
            }
        }
    };

    /**
     * Loads a google spreadsheet
     */
    PBF.ps.loadVisualisations = function () {
        new google.visualization.Query(PBF.ps.spreadsheet).send(PBF.ps.initVisualisations);
    };

    /**
     * Callback to take the loaded spreadsheet, pull the data table
     * and initialise the visualisations
     *
     * @param response
     */
    PBF.ps.initVisualisations = function (response) {
        // initialise the dataTable
        PBF.ps.dataTable = response.getDataTable();
        PBF.ps.column.data = PBF.ps.dataTable.addColumn('number', 'Km');
        PBF.ps.populateColumnIndexes(PBF.ps.dataTable);

        var fbFormatter = new WebsiteFormatter('facebook');
        fbFormatter.format(PBF.ps.dataTable, PBF.ps.column.Facebook);
        var wsFormatter = new WebsiteFormatter('www');
        wsFormatter.format(PBF.ps.dataTable, PBF.ps.column.Website);
        wsFormatter.format(PBF.ps.dataTable, PBF.ps.column.Online);
        var shopFormatter = new WebsiteFormatter('shop');
        shopFormatter.format(PBF.ps.dataTable, PBF.ps.column.Shop);
        var fsFormatter = new WebsiteFormatter('fs');
        fsFormatter.format(PBF.ps.dataTable, PBF.ps.column.FS);
        var addressFormatter = new google.visualization.PatternFormat('{0}, {1}, {2}, {3}');
        addressFormatter.format(PBF.ps.dataTable, [PBF.ps.column.Address, PBF.ps.column.Suburb, PBF.ps.column.State, PBF.ps.column.Postcode]);

        // initialise the map
        PBF.ps.drawMap();

        // display the map for the first time
        PBF.ps.drawVisualisations(PBF.ps.dataTable);

        // initialise the brands select, has to be run
        // after drawVisualisations
        PBF.ps.populateBrands();

        // hide loading gif/
        $('#ps-loader').hide();
        $('#ps-content').show();
    };

    /**
     * Draws the map and dataview from current state of global arrays
     *
     * @param {Object}  dataTable
     * @param {Number[]} rows
     */
    PBF.ps.drawVisualisations = function (dataTable, rows) {
        var dataView = PBF.ps.getDataView(dataTable, rows);
        PBF.ps.removeMapElements();
        PBF.ps.drawPlacemarks(PBF.ps.map, dataView);
        PBF.ps.fitBounds();
        PBF.ps.drawDataView(dataView);
    };

    /**
     * Populates the column indexes
     *
     * @param {Object}  dataTable
     */
    PBF.ps.populateColumnIndexes = function (dataTable) {
        for (var i = 0, l = dataTable.getNumberOfColumns(); i < l; i++) {
            PBF.ps.column[dataTable.getColumnLabel(i)] = i;
        }
    };

    /**
     * Draws markers on the map representing the passed in data
     *
     * @param {Object}  map
     * @param {Object}  dataView
     */
    PBF.ps.drawPlacemarks = function (map, dataView) {
        for (var r = 0, nr = dataView.getNumberOfRows(); r < nr; r++) {
            var row = PBF.ps.getRow(dataView, r);
            if (isNaN(row.Lat) === false) {
                PBF.ps.addPlacemark(map, row.Lat, row.Lng, row.Name, null, row);
                PBF.ps.addBrands(row.Brands);
            }
        }
    };

    /**
     * Adds brands to ordered global array
     *
     * @param {string} brandsStr
     */
    PBF.ps.addBrands = function (brandsStr) {
        if ((brandsStr != null) && (PBF.ps.brandsStrIgnore.indexOf(brandsStr.toLowerCase()) === -1)) {
            var brands = brandsStr.split(/\s*,\s*/);

            for (var i = 0, l = brands.length; i < l; i++) {
                if (PBF.ps.brands.indexOf(brands[i].trim()) === -1) {
                    PBF.ps.brands.push(brands[i].trim());
                }
            }
        }

        PBF.ps.brands.sort();
    };

    /**
     * Populates the brand select
     */
    PBF.ps.populateBrands = function () {
        for (var i = 0, l = PBF.ps.brands.length; i < l; i++) {
            $('#brand').append($('<option>', {text: PBF.ps.brands[i]}));
        }
    };

    /**
     * Gets a Row into an object for easier use
     *
     * @param {Object} dataView
     * @param {int} rowNum
     * @return  {Object}
     */
    PBF.ps.getRow = function (dataView, rowNum) {
        var returnVal = {};
        for (var c = 0, nc = dataView.getNumberOfColumns(); c < nc; c++) {
            var columnName = dataView.getColumnLabel(c);
            var columnValue = dataView.getValue(rowNum, c);
            if (['Lat', 'Lng'].indexOf(columnName) !== -1) {
                returnVal[columnName] = parseFloat(columnValue);
            } else {
                returnVal[columnName] = columnValue;
            }
        }
        return returnVal;
    };

    /**
     * Add a homeicon
     *
     * @param map
     * @param lat
     * @param lng
     */
    PBF.ps.addHome = function (map, lat, lng) {
        var myLatLng = new google.maps.LatLng(lat, lng);
        var icon = new google.maps.MarkerImage(PBF.ps.homeImage);
        var marker = new google.maps.Marker({
            map: map,
            position: myLatLng,
            title: 'Your search location',
            icon: icon
        });

        PBF.ps.markers.push(marker);
    };
    /**
     * Add a placemark to the map
     *
     * @param map
     * @param lat
     * @param lng
     * @param title
     * @param image
     * @param {Object} display  Display in popup
     */
    PBF.ps.addPlacemark = function (map, lat, lng, title, image, display) {
        var myLatLng = new google.maps.LatLng(lat, lng);
        var icon = new google.maps.MarkerImage(PBF.ps.markerImage);
        var marker = new google.maps.Marker({
            map: map,
            position: myLatLng,
            title: title,
            icon: icon
        });

        PBF.ps.markers.push(marker);

        PBF.ps.infoWindows.push(PBF.ps.makeInfoWindow(title, image, display));

        var position = PBF.ps.infoWindows.length - 1;

        var callback = (function closure(place) {
            return function () {
                PBF.ps.closeAllWindows();
                PBF.ps.infoWindows[place].open(map, PBF.ps.markers[place]);
            };
        })(position);

        google.maps.event.addListener(marker, 'click', callback);
    };

    /**
     * Removes any existing elements from the map
     */
    PBF.ps.removeMapElements = function () {
        for (i = 0; i < PBF.ps.markers.length; i++) {
            PBF.ps.markers[i].setMap(null);
        }
        PBF.ps.markers.length = 0;
        PBF.ps.closeAllWindows();
        PBF.ps.infoWindows = [];
    };

    /**
     * Make an info window popup
     *
     * @param title
     * @param image
     * @param {Object} display  Display in popup
     */
    PBF.ps.makeInfoWindow = function (title, image, display) {
        var content = '<div class="ps-info-window-content">';

        if (image !== null) {
            content += '<div class="col-sm-4"><img src="' + image + '" alt="' + title + ' Photo" class="img-responsive img-thumbnail"/></div><div class="col-sm-8">';
        }

        content += '<h4>' + title + '</h4>';
        content += '<div class="iw-address">' + [display.Address, display.Suburb, display.State, display.Postcode].join(', ') + '</div>';
        if (display.Phone !== null) {
            content += '<div class="iw-phone">' + display.Phone + '</div>';
        }
        if (display.Website !== null) {
            content += '<div class="iw-url"><a href="' + display.Website + '" target="_blank">' + display.Website + '</a></div>';
        }
        if (display.Facebook !== null) {
            content += '<div class="iw-url"><a href="' + display.Facebook + '" target="_blank"><i class="fa fa-facebook-sign" aria-hidden="true"></i></a></div>';
        }

        content += '</div>';

        if (image !== null) {
            content += '</div>';
        }

        return new google.maps.InfoWindow({
            content: content
        });
    }
    ;

    /**
     * Shows a google GeoChart visualisation to the '#map' html element
     */
    PBF.ps.drawMap = function () {
        var mapOptions = {
            center: {lat: PBF.ps.mapCentre.lat, lng: PBF.ps.mapCentre.lng},
            zoom: PBF.ps.mapZoom,
            minZoom: 2,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        PBF.ps.map = new google.maps.Map(document.getElementById('ps-map'), mapOptions);
    };

    /**
     * Allow user to click on table and zoom map
     */
    PBF.ps.rowSelectFunction = function () {
        var select = PBF.ps.chart.getSelection();
        if (select.length > 0) {
            var row = PBF.ps.getRow(PBF.ps.dataTable, select[0].row);
            var pos = new google.maps.LatLng(row.Lat, row.Lng);
            PBF.ps.map.setCenter(pos);
            PBF.ps.map.setZoom(PBF.ps.mapZoomed);
            PBF.ps.closeAllWindows();
        }
    };

    /**
     * Close all pop up windows
     */
    PBF.ps.closeAllWindows = function () {
        for (var i = 0; i < PBF.ps.infoWindows.length; i++) {
            PBF.ps.infoWindows[i].close();
        }
    };

    /**
     * Converts table into dataView for display
     *
     * @param {Object} dataTable
     * @param {Number[]} rows
     */
    PBF.ps.getDataView = function (dataTable, rows) {
        var dataView = new google.visualization.DataView(dataTable);

        if (rows) {
            dataView.setRows(rows);
        }


        return dataView;
    };

    /**
     * Shows a google Table visualisation to the '#data-table' html element
     *
     * @param dataView
     */
    PBF.ps.drawDataView = function (dataView) {
        var options = {
            allowHtml: true
        };

        var hideColumnIndexes = [];
        for (var c = 0, l = dataView.getNumberOfColumns(); c < l; c++) {
            var columnName = dataView.getColumnLabel(c);
            if (PBF.ps.hideColumns.indexOf(columnName) !== -1) {
                hideColumnIndexes.push(c);
            }
        }
        dataView.hideColumns(hideColumnIndexes);

        PBF.ps.chart = new google.visualization.Table(document.getElementById('ps-data-table'));
        PBF.ps.chart.draw(dataView, options);
        google.visualization.events.addListener(PBF.ps.chart, 'select', PBF.ps.rowSelectFunction);
    };

    /**
     * Fit the map to the active markers
     */
    PBF.ps.fitBounds = function () {
        var bounds = new google.maps.LatLngBounds();
        for (i = 0; i < PBF.ps.markers.length; i++) {
            bounds.extend(PBF.ps.markers[i].getPosition());
        }

        PBF.ps.map.fitBounds(bounds);
    };

    /**
     * Show a dialog if there are no results
     */
    PBF.ps.showNoResults = function () {
        $("#ps-dialog-message").prop('title', 'No results')
            .text("Please change your selections and try again")
            .dialog({
                modal: true,
                buttons: {
                    Ok: function () {
                        $(this).dialog("close");
                    }
                }
            });
    };

    /**
     * Add distance columns to datatable
     *
     * @param {Object} dataTable
     * @param {Object} obj
     * @param {string} brand
     * @returns {int}
     */
    PBF.ps.addDistance = function (dataTable, obj, brand) {
        for (var r = 0, nr = dataTable.getNumberOfRows(); r < nr; r++) {
            var row = PBF.ps.getRow(dataTable, r);
            var hasBrand = PBF.ps.hasBrand(row.Brands, brand);
            var distance = PBF.ps.distance(row.Lat, row.Lng, obj.lat, obj.lng);
            dataTable.setCell(r, PBF.ps.column.data, hasBrand || isNaN(distance) ? PBF.ps.circumferenceEarth : distance.toFixed(2));
        }

        dataTable.sort(PBF.ps.column.data);
    };

    /**
     * Calculate the distance between two lat lng points
     *
     * @param lat1
     * @param lon1
     * @param lat2
     * @param lon2
     * @returns {number}
     */
    PBF.ps.distance = function (lat1, lon1, lat2, lon2) {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        //var radlon1 = Math.PI * lon1 / 180;
        //var radlon2 = Math.PI * lon2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        return dist * 1.609344;
    };

    /**
     * Check if brand in brand string
     *
     * @param brandsString
     * @param brand
     * @returns {boolean}
     */
    PBF.ps.hasBrand = function (brandsString, brand) {
        if (brand === 'All') {
            return true;
        }
        if (brandsString === null) {
            return false;
        }
        var brands = brandsString.split(',');
        brand = brand.trim().toLowerCase();
        for (var i = 0, l = brands.length; i < l; i++) {
            if (brands[i].trim().toLowerCase() === brand) {
                return true;
            }
        }
        return false;
    };


    /**
     * Filter the data and map markers according to the
     * form state
     *
     * @param {string}  instigator
     */
    PBF.ps.applyFilters = function (instigator) {
        // only allow either state or search, never both
        if (instigator === 'state') {
            $('#search').val('');
        } else if (instigator === 'search') {
            $('#state').val('All');
        }

        var brand = $("#brand").val();
        var state = $("#state").val();
        var search = $("#search").val();

        /**
         * Callback filter to check if brand matches
         *
         * @param value
         * @returns {boolean}
         */
        function checkBrand(value) {
            return PBF.ps.hasBrand(value, brand);
        }

        // create filters
        var filters = [];

        if (search !== '') {
            var parts = search.split(',');
            if (parts.length === 2) {
                /*
                 * simple suburb search
                 filters.push({
                 column: PBF.ps.column.Postcode,
                 value: parseInt(parts[1], 10)
                 });
                 filters.push({
                 column: PBF.ps.column.Suburb,
                 value: parts[0]
                 });
                 */
                PBF.ps.addDistance(PBF.ps.dataTable, PBF.ps.searchObject, brand);

                filters.push({
                    test: function (value, rowNum) {
                        return rowNum < PBF.ps.numClosestVenues;
                    },
                    column: PBF.ps.column.Lat, // dummy value, only interested in test
                    minValue: -100, // dummy value, only interested in test
                    maxValue: 100 // dummy value, only interested in test
                });

                filters.push({
                    column: PBF.ps.column.data,
                    maxValue: PBF.ps.circumferenceEarth - 1
                });
            }
        } else {
            if (state !== 'All') {
                filters.push({
                    column: PBF.ps.column.State,
                    value: state
                });
            }

            if (brand !== 'All') {
                filters.push({
                    column: PBF.ps.column.Brands,
                    test: checkBrand
                });
            }
        }

        // Datatable doesn't have a public getrows method, so invent one
        if (filters.length === 0) {
            filters.push({
                column: PBF.ps.column.Name,
                test: function () {
                    return true;
                }
            });
        }

        var rows = PBF.ps.dataTable.getFilteredRows(filters)

        if (rows.length > 0) {
            // redraw map
            PBF.ps.drawVisualisations(PBF.ps.dataTable, rows);

            if (search !== '') {
                PBF.ps.addHome(PBF.ps.map, PBF.ps.searchObject.lat, PBF.ps.searchObject.lng)
            }
        } else {
            PBF.ps.showNoResults();
        }
    };

// go ...
    google.load('visualization', '1', {packages: ['table']});
    google.maps.event.addDomListener(window, 'load', PBF.ps.loadVisualisations);

    /*
     * jQuery load function to set up listeners etc
     */
    $(document).ready(function () {
        // set up the autocomplete
        $.getJSON(PBF.ps.postcodesFile, function (results) {
            var postcodes = $.map(results, function (value) {
                return {
                    label: value.sub + ', ' + value.pc,
                    value: value.sub + ', ' + value.pc,
                    obj: value
                };
            });
            $('#search').autocomplete({
                minLength: 4,
                source: postcodes,
                select: function (event, ui) {
                    PBF.ps.searchObject = ui.item.obj;
                    PBF.ps.applyFilters(this.id);
                    return false;
                },
                focus: function (event, ui) {
                    $('#search').val(ui.item.label);
                    return false;
                }
            });
        }).fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ', ' + error;
            console.log('Request Failed: ' + err);
        });

        $('#reset-map').click(function () {
            $('#state').val('All');
            $('#brand').val('All');
            $('#search').val('');
            PBF.ps.drawVisualisations(PBF.ps.dataTable);
        });

        $('#state, #brand').change(function () {
            PBF.ps.applyFilters(this.id);
        });

        $("#search").keypress(function (e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) { //Enter keycode
                return false;
            }
        });
    });
})(jQuery);

