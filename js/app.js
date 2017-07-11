//  set of neihborhood locations
var locations = [
    {title: 'Grand Mall', location: {lat: 29.965562, lng: 31.270058}, id: 0},
    {title: 'Victory College', location: {lat: 29.962481, lng: 31.271578}, id: 1},
    {title: 'the courtyard', location: {lat: 29.977520, lng: 31.284856}, id: 2},
    {title: 'Arab Organization For Industry Hospital', location: {lat: 29.984047, lng: 31.278355}, id: 3},
    {title: 'As-Salam International Hospital', location: {lat: 29.98481, lng: 31.230053}, id: 4},
    {title: 'Cairo American College', location: {lat: 29.958616, lng: 31.274428}, id: 5}
];
// set of markers that will be shown in the map
var markers = [];

// Google maps' map
var map;

// info window to appear when marker is pressed
var largeInfowindow;

// Style the markers a bit. This will be our listing marker icon.
var defaultIcon;

// Create a "highlighted location" marker color for when the user
// mouses over the marker.
var highlightedIcon;

// Error handler for Google Maps API
function error(){
	alert("There is an error in loading google maps api");
}

// This function loads the map, shows the markers and set listener to them
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 29.9627, lng: 31.2769},
          zoom: 13
        });
	console.log(map);
	defaultIcon = makeMarkerIcon('0091ff');
	highlightedIcon = makeMarkerIcon('FFFF24');
	
	// This function takes in a COLOR, and then creates a new marker
	// icon of that color. The icon will be 21 px wide by 34 high, have an origin
	// of 0, 0 and be anchored at 10, 34).
	function makeMarkerIcon(markerColor) {
		var markerImage = new google.maps.MarkerImage(
			'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
			'|40|_|%E2%80%A2',
			new google.maps.Size(21, 34),
			new google.maps.Point(0, 0),
			new google.maps.Point(10, 34),
			new google.maps.Size(21,34));
		return markerImage;
		}
	function itemClicked(index) {
		return function(){
			infowindow = largeInfowindow;
			markerCopy = markers[index];
			// Check to make sure the infowindow is not already opened on this marker.
			if (infowindow.marker != markerCopy) {
				for (var i = 0; i < markers.length; i++) {
					markers[i].setAnimation(null);
				}
				markerCopy.setAnimation(google.maps.Animation.BOUNCE);
				map.setCenter(markerCopy.position);
				var title = '<h2>' + markerCopy.title + '</h2>';
				infowindow.setContent(title);
				
				// Timeout to check failure
				var wikiResultTimeout = setTimeout(function() {
					infowindow.setContent( title + 'failed to get wikipedia resources');
				}, 8000);
				
				// ajax request to get wikipedia articles
				$.ajax({
					url : 'https://en.wikipedia.org/w/api.php?'+
                      'action=opensearch&search=' + markerCopy.title +
                      '&format=json&callback=wikiCallback',
					dataType: "jsonp",
					success: function(response) {
						var articleList = response[1];
						if(articleList.length === 0) {
							infowindow.setContent( title + 'no wikipedia articles found!');
						} else {
							wikiResult = '';
							for(var i=0; i<articleList.length; i++) {
								wikiResult += '<li><a href="' + response[3][i] + '">' + articleList[i] + '</a></li>';
							}
							infowindow.setContent(title + wikiResult);
						}
						clearTimeout(wikiResultTimeout);
					}
				});
				infowindow.open(map, markerCopy);
				// Make sure the marker property is cleared if the infowindow is closed.
				infowindow.addListener('closeclick',function(){
					infowindow.setMarker = null;
				});
			}
        };
	}
		function mouseover(index) {
			return function() {
				markers[index].setIcon(highlightedIcon);
			};
		}
		function mouseout(index) {
			return function() {
				markers[index].setIcon(defaultIcon);
			};
		}
	
	largeInfowindow = new google.maps.InfoWindow();
	
	for(var i=0; i<locations.length; i++) {
		marker = new google.maps.Marker({
			map: map,
			position: locations[i].location,
			title: locations[i].title,
			icon: defaultIcon,
			animation: google.maps.Animation.DROP
		});
		markers.push(marker);
		
		marker.addListener('click', itemClicked(i));
		
		// Two event listeners - one for mouseover, one for mouseout,
		// to change the colors back and forth.
		marker.addListener('mouseover', mouseover(i));
		marker.addListener('mouseout', mouseout(i));
	}
	// if(map !== null) {
		// // apply bindings to ko after the map is loaded
		// clearTimeout(GmapsTimeout);
		ko.applyBindings(new ViewModel());
	// }
}

// adjust the model of ko
var Location = function(data) {
	var self = this;
	this.title = data.title;
	this.location = data.location;
	this. id = data.id;
};

// adjust viewModel for ko
var ViewModel = function() {
	var self = this;
	
	this.locationsList = ko.observableArray([]);
	this.markersList = ko.observableArray([]);
	
	locations.forEach(function(location) {
		self.locationsList.push(new Location(location));
	});
	
	this.searchText = ko.observable("");
	
	// This function filters the neighborhood locations
	this.search = function() {
		var search = self.searchText();
		if(search === '') {
			alert('Please enter something to search about');
		} else {
			self.locationsList.removeAll();
			for(var i=0; i<locations.length; i++) {
				if(locations[i].title.toUpperCase().indexOf(search.toUpperCase()) != -1) {
					self.locationsList.push(new Location(locations[i]));
					markers[i].setMap(map);
				} else {
					markers[i].setMap(null);
				}
			}
			if(self.locationsList().length === 0) {
				alert('We could not find any locations within this search!');
			}
		}
	};
	
	// This function resets the filter
	this.cancel = function() {
		self.locationsList.removeAll();
		for(var i=0; i<locations.length; i++) {
			self.locationsList.push(new Location(locations[i]));
			markers[i].setMap(map);
		}
	};
	
	// This function shows the infowindow when item is clicked from the list
	this.itemClicked = function(item) {
		google.maps.event.trigger(markers[item.id], 'click');
	};
};