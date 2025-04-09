import { useEffect, useState } from "react";
import Map, { Marker, Source, Layer, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import polyline from "@mapbox/polyline";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function HospitalMap({ hospitals, boundary, route, hospital, userLocation }) {
  const [viewState, setViewState] = useState({
    longitude: -95.7133,
    latitude: 37.0902,
    zoom: 4
  });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);

  useEffect(() => {
    if (route?.polyline) {
      const coords = polyline.decode(route.polyline).map(([lat, lon]) => [lon, lat]);
      console.log ("Decoded coordinates:",polyline.decode(route.polyline))
      
      const lons = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
  
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
  
      setViewState(prev => ({
          ...prev,
          longitude: (minLon + maxLon) / 2,
          latitude: (minLat + maxLat) / 2,
          zoom: 10,
          transitionDuration: 1000
        }));
      setRouteGeoJSON({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: coords
            },
            properties: {}
          }
        ]
      });
    }
  }, [route]);

  useEffect(() => {
    if (hospitals?.length > 0) {
      const lons = hospitals.map(h => h.geometry.coordinates[0]);
      const lats = hospitals.map(h => h.geometry.coordinates[1]);

      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      setViewState(prev => ({
        ...prev,
        longitude: (minLon + maxLon) / 2,
        latitude: (minLat + maxLat) / 2,
        zoom: 10,
        transitionDuration: 1000
      }));
    } else if (boundary?.features) {
      const coordinates = boundary.features[0].geometry.coordinates[0];
      const lons = coordinates.map(coord => coord[0]);
      const lats = coordinates.map(coord => coord[1]);

      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      setViewState(prev => ({
        ...prev,
        longitude: (minLon + maxLon) / 2,
        latitude: (minLat + maxLat) / 2,
        zoom: 10,
        transitionDuration: 1000
      }));
    }
  }, [hospitals, boundary]);

  return (
    <div className="map-container-inner">
    
      {/* Summary Card */}
      {hospital && route && (
        <div className="chart-container">
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>Nearest Hospital Summary</h3>
          <p><strong>🏥 Hospital:</strong> {hospital.properties.LandmkName || "Unknown"}</p>
          <p><strong>📍 Location:</strong> {hospital.properties.City || "N/A"}</p>
          <p><strong>🛣️ Distance:</strong> {route.distance_km?.toFixed(2)} km</p>
          <p><strong>🕒 Estimated Time:</strong> {route.time_min?.toFixed(1)} min</p>
        </div>
      )}
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker longitude={userLocation[0]} latitude={userLocation[1]}>
            <div style={{ fontSize: "20px" }}>📍</div>
          </Marker>
        )}

        {/* Hospital from routing response */}
        {hospital && (
          <Marker
            longitude={hospital.geometry.coordinates[0]}
            latitude={hospital.geometry.coordinates[1]}
          >
          <button
                onClick={() => setSelectedHospital(hospital)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px" }}
              >
                🏥
              </button>
            
          </Marker>
        )}

        

        {/* Hospital Popup */}
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
              <p><strong>📞 Phone:</strong> {selectedHospital.properties.Phone?.trim() || "N/A"}</p>
              <p><strong>🌐 Website:</strong> <a href={selectedHospital.properties.URL} target="_blank" rel="noopener noreferrer">Visit</a></p>
              <p><strong>🏥 Type:</strong> {selectedHospital.properties.SrcTyp || "N/A"}</p>
            </div>
          </Popup>
        )}

        {/* County Boundary */}
        {boundary && boundary.features && (
          <Source id="county-boundary" type="geojson" data={boundary}>
            <Layer
              id="boundary-layer"
              type="line"
              paint={{ "line-color": "#ff0000", "line-width": 3 }}
            />
          </Source>
        )}

        {/* Route Polyline */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#007cbf",
                "line-width": 4
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}