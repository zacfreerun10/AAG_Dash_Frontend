import { useEffect, useState } from "react";
import Map, { Source, Layer, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MAPBOX_TOKEN = ProcessingInstruction.env.REACT_APP_MAPBOX_TOKEN;

export default function MortalityMap({ boundary, data }) {
  console.log("boundary prop:", boundary);

  const [viewState, setViewState] = useState({
    longitude: -95.7133,
    latitude: 37.0902,
    zoom: 6
  });

  const [selectedCounty, setSelectedCounty] = useState(null);
  const [topN, setTopN] = useState(50); // State to manage the number of counties to display in the pie chart

  useEffect(() => {
    if (boundary && boundary.features && boundary.features.length > 0) {
      console.log("🗺️ Updating Mortality Map with multiple boundaries:", boundary);

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
              county_name: feature.properties?.county_name || data.county_name || "Unknown County",
              indicator: feature.properties?.indicator || data.mortalityRate|| "N/A",
              indicator_value:feature.properties?.indicator_value || "N/A",
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

  // Prepare data for the pie chart
  const topNData = (boundary.features || []).slice(0, topN).map(feature => ({
    county_name: feature.properties.county_name,
    indicator: feature.properties.indicator,
    indicator_value: feature.properties.indicator_value
  }));

  const pieData = {
    labels: topNData.map(item => item.county_name),
    datasets: [
      {
        label: `${topNData[0]?.indicator || 'Indicator'}`,
        data: topNData.map(item => item.indicator_value),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#808000',
          '#008080',
          '#000080',
          '#cc3366',
          '#f88379 ',
          '#FF5733',
          '#33FF57',
          '#5733FF',
          '#FF33A8',
          '#33A8FF',
          '#A833FF',
          '#FFD700',
          '#40E0D0',
'#FF4500',
'#6A5ACD',
'#00FA9A',
'#DC143C',
'#8A2BE2',
'#FF6347',
'#4682B4',
'#D2691E',
'#9ACD32',
'#2E8B57',
'#B22222',
'#32CD32',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#808000',
          '#008080',
          '#000080',
          '#cc3366',
          '#f88379 ',
          '#FF5733',
'#33FF57',
'#5733FF',
'#FF33A8',
'#33A8FF',
'#A833FF',
'#FFD700',
'#40E0D0',
'#FF4500',
'#6A5ACD',
'#00FA9A',
'#DC143C',
'#8A2BE2',
'#FF6347',
'#4682B4',
'#D2691E',
'#9ACD32',
'#2E8B57',
'#B22222',
'#32CD32',
        ]
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 20,
          padding: 10,
        },
      },
      title: {
        display: true,
        text: `${topNData[0]?.indicator } Data Comparision of Counties`,
      },
    },
  };

  const handleQuery = (countyName) => {
    const county = boundary.features.find(feature => feature.properties.county_name === countyName);
    if (county) {
      setSelectedCounty({
        county_name: county.properties.county_name,
        indicator: county.properties.indicator,
        indicator_value: county.properties.indicator_value,
        longitude: county.geometry.coordinates[0][0][0], // Assuming the first coordinate is representative
        latitude: county.geometry.coordinates[0][0][1],
      });
    } else {
      console.warn(`County ${countyName} not found.`);
    }
  };

  return (
    <div className="map-container-inner">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleCountyClick}
      >
        {/* Render county boundary */}
        {boundary && boundary.features && boundary.features.length > 0 && (
          <Source id="county-boundary" type="geojson" data={{ type: "FeatureCollection", features: boundary.features || [] }}>
            <Layer
              id="boundary-layer"
              type="fill"
              paint={{
                "fill-color": "#ff4d4d",
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
              <p><strong>{selectedCounty.indicator}:</strong> {selectedCounty.indicator_value}</p>
            </div>
          </Popup>
        )}
      </Map>
      {/* Render Pie Chart */}
      <div className="pie-chart-container">
        <Pie data={pieData} options={pieOptions} />
      </div>
    </div>
  );
}