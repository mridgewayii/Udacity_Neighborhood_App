/*Open and close sidebar for locations*/
function openNav() {
    document.getElementById("mySidenav").style.width = "420px";
}
function closeNav() {
    document.getElementById("mySidenav").style.width = "0px";
}
/* Declare Variables */
var bounds;
var infoWindow;
var googleMap;
var title;
var position;
var type;
var web;
var street;
var city;
var phone;
var reviews;
var display;
/* In the following example, markers appear when the user clicks on the map.
** Each marker is labeled with a single alphabetical character.*/
var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var labelIndex = 0;
/* Initialize Google Map
** establish the type of views to be presented to the user
** Set the point in which the map centers and set where the 
** menues are displayed and the type of the menu*/
function initMap() 
    {
        var CharlestonSC = { lat: 32.798301, lng: -79.946586 };
        googleMap = new google.maps.Map(document.getElementById('map'), 
            {
                zoom: 5,
                center: CharlestonSC,
                mapTypeControl: true,
                streetViewControl: true,
                mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                position: google.maps.ControlPosition.LEFT_CENTER
            },
        });
        infoWindow = new google.maps.InfoWindow
            ({
                pixelOffset: new google.maps.Size(0,0)
            });
        bounds = new google.maps.LatLngBounds();
        ko.applyBindings(new ViewModel());
    }

/*Error Handling index.html line 65 - Per Google API*/
function googleMapsError() 
    {
        alert('There was a fatal error with the Google Maps API');
    }

/* Use Knockout to display items and provide searchability */
var ViewModel = function() {
    this.searchLocList = ko.observable('');
    this.mapList = ko.observableArray([]);
    var instance = this;
    /* Use the data.js file locations to place markers on the map */
    locations.forEach(function(location) 
        {
            instance.mapList.push( new LocationMarker(location) );
        });
    /* Filter locations to be viewed on the map */
    this.locationList = ko.computed(function() {
        var searchFilter = instance.searchLocList().toLowerCase();
        if (searchFilter) 
            {
            return ko.utils.arrayFilter(instance.mapList(), function(location) 
                {
                    var searchStringLocation = location.title.toLowerCase();
                    var searchResult = searchStringLocation.includes(searchFilter);
                    location.display(searchResult);
                    return searchResult;
                });
        }
        instance.mapList().forEach(function(location) 
            {
                location.display(true);
            });
        return instance.mapList();
    }, instance);
};

/* Foursquare API */ 
var LocationMarker = function(data) {
    /* Initiate variables and append as applicable */
    /* Set Client Secrets from Foursquare to gain access to their location
    ** specific JSON API
    ** https://developer.foursquare.com/*/
    var clientID = 'AD01IFB3BC0RSDXX3UXT112RU1XR5CATKLEJPWI1KZKYDV2J';
    var clientSecret = 'P5JYIWLVL315NVJVJDOXTNAWSLLGVMN3DR4XNNF44XULAN4M';
    this.title = data.title;
    this.position = data.location;
    this.type = '';
    this.web = '';
    this.street = '',
    this.city = '',
    this.phone = '';
    this.reviews = '';
    this.display = ko.observable(true);
    var instance = this;
    /* Get JSON data from FourSquare */
    $.getJSON('https://api.foursquare.com/v2/venues/search?ll=' + 
                this.position.lat + ',' + this.position.lng + 
                '&client_id=' + clientID + '&client_secret=' + 
                clientSecret + '&v=20160118' + '&query=' + this.title,
        function(data) 
            {
                instance.street = data.response.venues[0].location.formattedAddress[0];
                instance.city = data.response.venues[0].location.formattedAddress[1];
                instance.type = data.response.venues[0].categories[0].name;        
                instance.web = data.response.venues[0].url;
                instance.phone = data.response.venues[0].contact.formattedPhone;
                instance.reviews = data.response.venues[0].stats.tipCount;
            }
    ).fail(function() 
        {
        alert('A Foursquare Error has occured.');
        }
    );
    /* Create all of the markers based on the dataset in data.js 
    ** Credit: Google Map API Developer Website*/
    this.marker = new google.maps.Marker(
        {
            position: this.position,
            title: this.title,
            draggable: false,
            animation: google.maps.Animation.DROP,
            icon: makeMarkerIcon('19ff00'),
        }
    );

    /* Size the map based on the dataset in data.js */
    instance.filterMarkers = ko.computed(function () 
        {
        if(instance.display() === true) 
            {
            instance.marker.setMap(googleMap);
            bounds.extend(instance.marker.position);
            googleMap.fitBounds(bounds);
            googleMap.setZoom(googleMap.getZoom() - 5);
            } 
        else 
            {
            instance.marker.setMap(null);
            }
        }
    );
    // Create an onclick even to open an indowindow at each marker
    this.marker.addListener('click', function() 
        {
            informationalWindow(this, infoWindow, instance.type, 
                instance.web, instance.street, instance.city, 
                instance.phone, instance.reviews);
            toggleBounce(this);
            googleMap.panTo(this.getPosition());
        });
    /* Display item details */
    this.show = function(location) 
        {
            google.maps.event.trigger(instance.marker, 'click');
        };
    if (true){
            this.marker.addListener('mouseover', function()
                {this.setIcon(makeMarkerIcon('f47384'))});
            this.marker.addListener('mouseout', function()
                {this.setIcon(makeMarkerIcon('19ff00'))});
        }
};/* End Foursquare API */ 

/* This method actually creates the window that is seen when the map marker
** is clicked.  We have to pass the variables established previously to
** this function and tell it to render some simple html code as a result.*/
function informationalWindow(marker, infowindow, type, web, street, city, phone, reviews) 
    {
        /* Check to make sure the infowindow is not already 
        ** opened on this marker. */
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            /* Make sure the marker property is cleared if the 
            ** infowindow is closed. */
            infowindow.addListener('closeclick', function() 
                {
                    infowindow.marker = null;
                });
            /* Make sure the marker property is cleared if 
            ** the user clicks outside of the window. */
            google.maps.event.addListener(googleMap, "click", function(event) 
                {
                    infowindow.close();
                    infowindow.marker = null;
                });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 80;
            /* Set the information to be displayed on the informational window
            ** by using a combination of html and adding the variables related
            ** to the particular location*/
            var popupWindow = '<h4 class="text-center" \
                                style="background-color: #19FF00">' + 
                                marker.title + '</h4>' + '<p class="text-center">\
                                Food Type: <strong>' + 
                                type + "*</strong><br><a href='" + web + "' \
                                target='_blank'>" + marker.title + "'s Website*</a>\
                                <br>" + street + "*<br>" + city + '*<br>' + phone + 
                                "*</p><br><h4 class='text-center h4margin'>\
                                Number of Foursquare Reviews: " + reviews + "*</h4>\
                                <br><p class='text-center paracenter'>\
                                *Info provided and Copyright Foursquare.com</p>\
                                <a href='http://www.foursquare.com'>\
                                <img src='images/foursquare.png' class='foursq' \
                                width='30' height='30'></a>";
            /* Establish Google Streetview image for informational window. 
            ** This syntax was taken from the Google API Developer site:
            ** https://developers.google.com/maps/documentation/javascript/reference/3.exp/street-view-service*/
            var getStreetView = function (data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    infowindow.setContent(popupWindow + 
                                            '<div id="display"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 14
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('display'), panoramaOptions);
                } else {
                    infowindow.setContent(popupWindow + 
                        '<div>No Street View Found</div>');
                }
            };
            /* Open Streetview image */
            streetViewService.getPanoramaByLocation(marker.position, 
                                                    radius, getStreetView);
            infowindow.open(googleMap, marker);
        }
    }

/* This function establishes the size and shape (to some extent) of
** the pins placed on the map.  Much of this is directly from the Google
** website at:
** https://developers.google.com/maps/documentation/javascript/markers */
function makeMarkerIcon(markerColor) 
    {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + 
                markerColor + '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(0, 32),
        new google.maps.Size(21, 34));
        return markerImage;
    }

/* This function is taken in almost in total from Google's API Dev Website.
** https://developers.google.com/maps/documentation/javascript/examples/marker-animations */
function toggleBounce(marker) 
    {
        if (marker.getAnimation() !== null) 
            {
                marker.setAnimation(null);
            } 
        else 
            {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() 
                    {
                        marker.setAnimation(null);
                    }, 3600);
            }
    }