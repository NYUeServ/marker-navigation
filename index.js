/**
 * @name Marker Tab and Enter Key Navigation for Google Maps API v3
 * @version 0.1
 * @author riotrah with NYU STIT
 * @fileoverview
 *
 * This library allows simple tab navigation of the markers in Google Maps API.
 * It also allows 'clicking' the markers with the enter key.
 */

/* global google */

/* eslint-disable no-unused-vars */
/**
 * Initializer function.
 * It attaches a live object to the Google Maps object.
 * As such it needs to be loaded after Google Maps has fully loaded
 * 
 * @param  {DOM Element} mapDiv             The Div to which Google Maps Map 
 *                                          was attached
 * @param  {Map } map                       The actual Map object
 * @param  {Marker []]} markers             An array of Marker objects
 * @param  {Object} icons                   Object holding string paths for 
 *                                          .selected and .deselected
 * @param  {Boolean} distinctMarkerIconFlag A boolean describing whether 
 *                                          markers have distinct icons or each 
 *                                          follows a default
 */
function keyNavInit(mapDiv, map, markers, icons, distinctMarkerIconFlag) {

  let internalMapDiv;

  internalMapDiv = mapDiv
  .children[0]
  .children[0]
  .children[0];

  // Create static vars for this maps extension
  google.maps.markerNavigation = {};
  // Keep passed markers in object
  google.maps.markerNavigation.markers = markers;
  // Currently selected marker's index in Markers
  google.maps.markerNavigation.currentMarker = -1; 
  google.maps.markerNavigation.markerIcons = []; 
  google.maps.markerNavigation.updateMarkerCount = updateMarkerCount;

  __addTabNavToMapMarkers(map, internalMapDiv);

  if (icons) {
    if (icons.selected) {
      google.maps.markerNavigation.selectedMarkerIcon = icons.selected;
    }
    if (icons.deselected) {
      google.maps.markerNavigation.deselectedMarkerIcon = icons.deselected;
    }
  }

  if (distinctMarkerIconFlag) {

    google.maps.markerNavigation.markerIcons = __getMarkerIconsFromMarkers(markers);
  }

  /**
   * Resets current marker and eventListener if map is out of focus
   */
  internalMapDiv.addEventListener('focusout', (e) => {

    __deselectMarker(
      google.maps.markerNavigation.previousMarkerListener,
      google.maps.markerNavigation.markers[google.maps.markerNavigation.currentMarker]
    ); 
    google.maps.markerNavigation.currentMarker = -1;
  });
}

/**
 * Adds an event listener to google maps to capture Tab keypresses
 * It tracks every time the button is pressed to see what 'direction'
 * the current activeElement is travelling in in order to smoothly
 * iterate through the markers in an intuitive fashion.
 * If tab is pressed and the internal map div is now the active element,
 * it starts capturing tab presses until all markers have been iterated thru,
 * returning tab control to the browser to tab thru the other elements 
 * in the direction of entry.
 *
 * Basically it make Markers behave like DOM Elements as far as tab 
 * navigation is concerned.
 * 
 * @param  {Map} map    Google Maps API Object
 * @param  {DOM Element} mapDiv Internal DOM Element whose keypresses we are capturing
 */
function __addTabNavToMapMarkers(map, mapDiv) {

  const markers = google.maps.markerNavigation.markers || [];

  google.maps.event.addDomListener(document, 'keydown', (e) => {

    let direction;
    
    if (e.key === 'Tab' 
      && document.activeElement !== mapDiv) {
      
      direction = !e.shiftKey;
      if (direction) {

        google.maps.markerNavigation.currentMarker = -1;

      } else {

        google.maps.markerNavigation.currentMarker = markers.length;
      }

    } else if (document.activeElement === mapDiv 
      && e.key === 'Tab') {

      const shift = e.shiftKey;

      /**
       * This grabs the event listener from the current selected marker,
       * saves it to a prop of this object and passes that very listener
       * to the function upon next call. This ensures that the previous 
       * listener is deactivated to save some mem.
       */
      google.maps.markerNavigation.previousMarkerListener = 
        __iterateMarkers(
          google.maps.markerNavigation.previousMarkerListener, 
          map, 
          mapDiv, 
          shift, 
          markers
        );

      if (google.maps.markerNavigation.currentMarker >= markers.length 
        && !shift) {

        google.maps.markerNavigation.currentMarker = markers.length;

      } else if (google.maps.markerNavigation.currentMarker <= -1 && shift) {

        google.maps.markerNavigation.currentMarker = -1;

      } else {

        e.preventDefault();
      }
    }
  });
}

/**
 * Step through each marker in the appropriate direction.
 * Returns the added 'Enter' keypress event listener that gets attached to the 
 * newly selected Marker.
 * 
 * @param  {EventListener} listener   Google Maps API EventListener of previous 
 *                                    iteration
 * @param  {Map} map                  Map Object
 * @param  {DOM Element} mapDiv       Internal Map element whose keypresses we 
 *                                    are capturing
 * @param  {Boolean} shift            Whether or not shift key is being pressed
 * @return {EventListener}            Google Maps API EventListener of 
 *                                    just-selected Marker
 */
function __iterateMarkers(listener, map, mapDiv, shift) {

  const markers = google.maps.markerNavigation.markers || [];
  if (!markers.length) { google.maps.markerNavigation.currentMarker = 0; } 

  const mod = shift
    ? -1
    : 1;

  const newListener = __selectMarker(
    map,
    mapDiv, 
    markers[google.maps.markerNavigation.currentMarker + mod]
  );

  __deselectMarker(listener, markers[google.maps.markerNavigation.currentMarker]);
  google.maps.markerNavigation.currentMarker += mod;

  return newListener;
}

/**
 * Deselects the given marker.
 * Sets icon to either default deselected icon or its previous icon if given.
 * Then it removes the EventListener attached to this Marker.
 * The listener needs to be passed in by the function calling this one.
 * 
 * @param  {EventListener} enterListener Google Maps API EventListener to 
 *                                       remove from previous marker
 * @param  {Marker} marker               Google Maps API Marker to deselect
 */
function __deselectMarker(enterListener, marker) {

  if (!marker) { return; } 

  const icon = google.maps.markerNavigation.markerIcons.length 
    ? google.maps.markerNavigation.markerIcons[google.maps.markerNavigation.currentMarker]
    : google.maps.markerNavigation.deselectedMarkerIcon;

  marker.setIcon(icon);

  if (enterListener) { enterListener.remove(); }
}

/**
 * Selects the given Marker.
 * Sets icon to default selected icon.
 * Pans map to this marker.
 * Attaches an enter key event listener to this marker.
 * 
 * @param  {Map} map              Google Maps API Map Object
 * @param  {DOM Element} mapDiv   Map Div to check for the enter key Listener
 * @param  {Marker} marker        Google Maps API Marker Object
 * @return {EventListener}        Google Maps API EventListener returned by 
 *                                the newly attached listener
 */
function __selectMarker(map, mapDiv, marker) {

  if (!marker) { return; }

  marker.setIcon(google.maps.markerNavigation.selectedMarkerIcon);
  // Should pan as well 
  map.panTo(marker.getPosition());
  return __addClickMarkerViaEnterKey(mapDiv, marker);
}

/**
 * Attaches a listener to given Marker and returns its reference.
 * Simply triggers a click event on the given Marker, so if there is 
 * no click listener set then it does nothing.
 * @param  {DOM Element} mapDiv   Map Div to capture enter buttons in
 * @param  {Marker} marker        Google Maps API Marker Object
 * @return {EventListener}        Google Maps API EventListener returned by 
 *                                the newly attached listener
 */
function __addClickMarkerViaEnterKey(mapDiv, marker) {

  if (!marker) { return; }

  return google.maps.event.addDomListener(
    document,
    'keydown', 
    (e) => {
      // const code = (e.keyCode ? e.keyCode : e.which);
      if (document.activeElement === mapDiv 
        && e.key === 'Enter') {
        google.maps.event.trigger(marker, 'click');
      }
    }
  );
}

/**
 * Simply return the icons as an array from an array of Markers
 * @param  {Marker []} markers Array of Google Maps API Marker Object
 * @return {String []}         Array of String filepaths to icons
 */
function __getMarkerIconsFromMarkers(markers) {

  if (markers) {

    return markers.map((marker) => marker.icon);
  }
}

/**
 * Update the markers and their icons.
 * This is if anything causes the number of Markers to change
 * Or if they've been altered.
 * @param  {Marker []} markers Array of Google Maps API Marker Object
 */
const updateMarkerCount = (markers) => {

  // Set markers
  google.maps.markerNavigation.markers = markers;
  google.maps.markerNavigation.markerIcons = __getMarkerIconsFromMarkers(markers);
  
  // Clear previous marker enter listener
  google.maps.markerNavigation.previousMarkerListener = undefined;
};
