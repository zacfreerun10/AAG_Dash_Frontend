import { useEffect, useState } from "react";
import Map, { Marker, Source, Layer, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function HospitalMap({ hospitals, boundary }) {
  const [viewState, setViewState] = useState({
    longitude: -95.7133,
    latitude: 37.0902,
    zoom: 4
  });
  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    console.log("🏥 Hospitals received:", hospitals);
    console.log("🗺️ Boundary received:", boundary);

    if (hospitals.length > 0) {
      const lons = hospitals.map(h => h.geometry.coordinates[0]);
      const lats = hospitals.map(h => h.geometry.coordinates[1]);

      if (lons.length > 0 && lats.length > 0) {
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        setViewState(prevState => ({
          ...prevState,
          longitude: (minLon + maxLon) / 2,
          latitude: (minLat + maxLat) / 2,
          zoom: 10,
          transitionDuration: 1000
        }));
      }
    } else if (boundary && boundary.features) {
      // Adjust view state based on boundary if hospitals are not available
      const coordinates = boundary.features[0].geometry.coordinates[0];
      const lons = coordinates.map(coord => coord[0]);
      const lats = coordinates.map(coord => coord[1]);

      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      setViewState(prevState => ({
        ...prevState,
        longitude: (minLon + maxLon) / 2,
        latitude: (minLat + maxLat) / 2,
        zoom: 10,
        transitionDuration: 1000
      }));
    }
  }, [hospitals, boundary]);

  return (
    <div className="map-container-inner" >
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {hospitals.length > 0 &&
          hospitals.map((h, index) => (
            <Marker
              key={index}
              longitude={h.geometry.coordinates[0]}
              latitude={h.geometry.coordinates[1]}
            >
              <button
                onClick={() => setSelectedHospital(h)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "24px",
                }}
              >
                🏥
              </button>
            </Marker>
          ))}

        {selectedHospital && (
          <Popup
            longitude={selectedHospital.geometry.coordinates[0]}
            latitude={selectedHospital.geometry.coordinates[1]}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedHospital(null)}
            anchor="top"
          >
            <div style={{ fontSize: "14px", fontFamily: "Arial, sans-serif", padding: "5px" }}>
              <h3 style={{ marginBottom: "5px", fontSize: "16px", fontWeight: "bold" }}>
                {selectedHospital.properties.LandmkName || "Unknown Hospital"}
              </h3>
              <p><strong>📍 Address:</strong> {selectedHospital.properties.Address || "N/A"}</p>
              <p><strong>🏙️ City:</strong> {selectedHospital.properties.City || "N/A"}</p>
              <p><strong>📞 Phone:</strong> {selectedHospital.properties.Phone.trim() || "N/A"}</p>
              <p><strong>🌐 Website:</strong> <a href={selectedHospital.properties.URL} target="_blank" rel="noopener noreferrer">Visit</a></p>
              <p><strong>🏥 Type:</strong> {selectedHospital.properties.SrcTyp || "N/A"}</p>
            </div>
          </Popup>
        )}

        {boundary && boundary.features && (
          <Source
            id="county-boundary"
            type="geojson"
            data={boundary}
          >
            <Layer
              id="boundary-layer"
              type="line"
              paint={{ "line-color": "#ff0000", "line-width": 3 }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
