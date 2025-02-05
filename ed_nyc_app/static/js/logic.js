// Custom Helper FUnction for Boroughs
// The function that will determine the color of a neighborhood based on the borough that it belongs to
function chooseColor(borough) {
  let color = "black";

  // If statement on color
  if (borough === "Brooklyn") {
    color = "yellow";
  } else if (borough === "Bronx") {
    color = "red";
  } else if (borough === "Manhattan") {
    color = "orange";
  } else if (borough === "Queens") {
    color = "green";
  } else if (borough === "Staten Island") {
    color = "purple";
  } else {
    color = "black";
  }

  return color;
}

function createMap(complaint_type) {
  // Delete Map
  let map_container = d3.select("#map_container");
  map_container.html(""); // empties it
  map_container.append("div").attr("id", "map"); //recreate it


  // Step 1: CREATE THE BASE LAYERS
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Store the API query variables.
  // For docs, refer to https://dev.socrata.com/docs/queries/where.html.
  // And, refer to https://dev.socrata.com/foundry/data.cityofnewyork.us/erm2-nwe9.
  let baseURL = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json?";
  // Add the dates in the ISO formats
  let date = "$where=created_date between'2024-01-01T00:00:00' and '2025-01-01T00:00:00'";
  // Add the complaint type.
  let complaint = `&complaint_type=${complaint_type}`;
  // Add a limit.
  let limit = "&$limit=10000";

  // Assemble the API query URL.
  let url = baseURL + date + complaint + limit;
  console.log(url);

  d3.json(url).then(function (data) {
    // Step 2: CREATE THE DATA/OVERLAY LAYERS
    console.log(data);

    // Initialize the Cluster Group
    let heatArray = [];
    let markers = L.markerClusterGroup();

    // Loop and create marker
    for (let i = 0; i < data.length; i++){
      let row = data[i];
      let location = row.location;
      if(location){
        let marker = L.marker([location.coordinates[1], location.coordinates[0]]).bindPopup(`<h1>${row.incident_address}</h1><h3>${row.descriptor}</h3><h4>${row.created_date}</h4>`);
        markers.addLayer(marker);

        // Heatmap point
        heatArray.push([location.coordinates[1], location.coordinates[0]]);
      }
    }

    // Create Heatmap Layer
    let heatLayer = L.heatLayer(heatArray, {
      radius: 25,
      blur: 10
    });

    // Get GEOJSON Data
    let url2 = "https://2u-data-curriculum-team.s3.amazonaws.com/dataviz-classroom/v1.1/15-Mapping-Web/nyc.geojson";
    d3.json(url2).then(function (geo_data) {
      // Make the GEOJSON Layer
      let geoLayer = L.geoJSON(geo_data, {
        // Dynamic Style Object
        style: function (feature) {
          return {
            color: "black",
            fillColor: chooseColor(feature.properties.borough),
            fillOpacity: 0.5,
            weight: 5
          };
        },
        // This is called on each feature.
        onEachFeature: function (feature, layer) {
          // PART 1: EVENT LISTENERS
          // Set the mouse events to change the map styling.
          layer.on({
            // When a user's mouse cursor touches a map feature, the mouseover event calls this function, which makes that feature's opacity change to 90% so that it stands out.
            mouseover: function (event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.9
              });
            },
            // When the cursor no longer hovers over a map feature (that is, when the mouseout event occurs), the feature's opacity reverts back to 50%.
            mouseout: function (event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.5
              });
            },
            // When a feature (neighborhood) is clicked, it enlarges to fit the screen.
            click: function (event) {
              myMap.fitBounds(event.target.getBounds());
            }
          });

          // PART 2: Popups
          // Giving each feature a popup with information that's relevant to it
          layer.bindPopup("<h1>" + feature.properties.neighborhood + "</h1> <hr> <h2>" + feature.properties.borough + "</h2>");
        }
      });

      // Step 3: CREATE THE LAYER CONTROL
      let baseMaps = {
        Street: street,
        Topography: topo
      };

      let overlayMaps = {
        HeatMap: heatLayer,
        Borough: geoLayer
      };

      overlayMaps[complaint_type] = markers; // dynamic layer control key

      // Step 4: INITIALIZE THE MAP
      let myMap = L.map("map", {
        center: [40.7128, -74.0059],
        zoom: 11,
        layers: [street, geoLayer, markers]
      });

      // Step 5: Add the Layer Control, Legend, Annotations as needed
      L.control.layers(baseMaps, overlayMaps).addTo(myMap);
    });
  });
}

function init() {
  let complaint_type = d3.select("#complaint_type").property("value");
  createMap(complaint_type);
}

// Event Listener
d3.select("#filter-btn").on("click", function () {
  init();
});

// on page load
init();
