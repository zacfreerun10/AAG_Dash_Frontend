import { useEffect, useState } from "react";
import Map, { Source, Layer, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MAPBOX_TOKEN = "pk.eyJ1IjoibWV0cm9raW0yMTciLCJhIjoiY2x4dzFrazJxMmJkajJycHpnNThpYjZpZiJ9.l0lDGi84xouJXT_uq91FOQ";

export default function HealthIndicatorMap({ boundary = [], classification_data = [], data }) {
  console.log("boundary prop:", boundary);


  const [viewState, setViewState] = useState({
    longitude: -95.7133,
    latitude: 37.0902,
    zoom: 6
  });

  const [selectedCounty, setSelectedCounty] = useState(null);

  useEffect(() => {
    if (boundary.features.length > 0) {
      console.log("🗺️ Updating Health Indicator Map with multiple boundaries:", boundary);

      // Extract ALL boundary coordinates for centering the map
      const allCoords = boundary.features.flatMap(b =>
        b.geometry?.type === "Polygon"
          ? b.geometry.coordinates[0]
          : b.geometry.coordinates.flat(1) || []
      );

      const lons = allCoords.map(c => c[0]);
      const lats = allCoords.map(c => c[1]);

      if (lons.length > 0 && lats.length > 0) {
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        setViewState({
          longitude: (minLon + maxLon) / 2,
          latitude: (minLat + maxLat) / 2,
          zoom: 6, // Adjust zoom for multiple counties
          transitionDuration: 1000
        });
      }
    }
  }, [boundary]);

  const handleCountyClick = (event) => {
    const map = event.target;
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['boundary-layer']
    });

    if (features && features.length > 0) {
      const feature = features[0];
      const coords = feature.geometry.coordinates.flat(2);

      if (coords.length > 0) {
        // Pair the coordinates
        const pairedCoords = [];
        for (let i = 0; i < coords.length; i += 2) {
          pairedCoords.push([coords[i], coords[i + 1]]);
        }

        const validCoords = pairedCoords.filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

        if (validCoords.length > 0) {
          const centroid = validCoords.reduce((acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], [0, 0]);
          centroid[0] /= validCoords.length;
          centroid[1] /= validCoords.length;

          if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
            setSelectedCounty({
              county_name: feature.properties.county_name || "Unknown County",
              healthIndicator: feature.properties.indicator_value || "N/A",
              category: feature.properties.category || "N/A",
              indicator:feature.properties.indicator || "N/A",
              longitude: centroid[0],
              latitude: centroid[1],
            });
            
          } else {
            console.warn("Centroid is not a valid LngLat object.");
          }
        } else {
          console.warn("No valid coordinates found for the feature.");
        }
      } else {
        console.warn("No coordinates found for the feature.");
      }
    } else {
      console.warn("No features found at the clicked location.");
    }
  };

  // Filter out duplicate categories for the legend
  const uniqueCategories = classification_data.reduce((acc, item) => {
    if (!acc.some(category => category.category === item.category)) {
      acc.push(item);
    }
    return acc;
  }, []);

  // Prepare data for the chart
  const categoryCounts = classification_data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  

  const chartData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        label: 'Count of Counties',
        data: Object.values(categoryCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 3,
      },
    ],
  };

const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: `Chart showing count of counties`,
      },
    },
  };

  return (
    <div className="map-container-inner">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v10"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleCountyClick}
      >
        {/* Render county boundary */}
        {boundary && boundary.features && boundary.features.length > 0 && (
          <Source id="county-boundary" type="geojson" data={boundary}>
            <Layer
              id="boundary-layer"
              type="fill"
              paint={{
                "fill-color": [
                  "match",
                  ["get", "category"],
                  "High", "#FF0000",
                  "Low", "#00FF00",
                  "Moderate", "#0000FF",
                  
                  /* other */ "#FF4D4D"
                ],
                "fill-opacity": 0.4,
                "fill-outline-color": "#000000"
              }}
              onClick={handleCountyClick}
            />
          </Source>
        )}

        {/* Show Popup when a county is clicked */}
        {selectedCounty && (
          <Popup
            longitude={selectedCounty.longitude}
            latitude={selectedCounty.latitude}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedCounty(null)}
            anchor="top"
          >
            <div style={{ fontSize: "14px", fontFamily: "Arial, sans-serif", padding: "5px" }}>
              <h3 style={{ marginBottom: "5px", fontSize: "16px", fontWeight: "bold" }}>
                {selectedCounty.county_name}
              </h3>
              <p><strong> {selectedCounty.indicator}</strong></p>
              <p><strong> Count:</strong> {selectedCounty.healthIndicator}</p>
              <p><strong>Category:</strong> {selectedCounty.category}</p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Render Legend */}
      <div className="legend">
        <h4>Legend</h4>
        <ul>
          {uniqueCategories.map((item, index) => (
            <li key={index} style={{ color: item.color }}>
              {item.category}
            </li>
          ))}
        </ul>
      </div>

      {/* Render Chart */}
      <div className="chart-container">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}