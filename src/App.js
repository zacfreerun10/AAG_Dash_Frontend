import { useState } from "react";
import Chatbot from "./components/Chatbot";
import HospitalMap from "./components/HospitalMap";
import MortalityMap from "./components/MortalityMap";
import HealthIndicatorMap from "./components/HealthIndicatorMap";
import ErrorBoundary from "./components/ErrorBoundary";
import DefaultMap from "./components/DefaultMap";
import HospitalRouteMap from "./components/hospitalRoute";

function App() {
  const [hospitals, setHospitals] = useState([]);
  const [hospitalBoundary, setHospitalBoundary] = useState(null);

  const [mortalityBoundary, setMortalityBoundary] = useState(null);
  const [mortalityData, setMortalityData] = useState(null);

  const [healthIndicatorBoundary, setHealthIndicatorBoundary] = useState(null);
  const [healthIndicatorData, setHealthIndicatorData] = useState(null);
  const [classificationData, setClassificationData] = useState([]);

  const [routedHospital, setRoutedHospital] = useState(null);
  const [route, setRoute] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const [activeMap, setActiveMap] = useState(null);

  const updateHospitalMap = (newHospitals, newBoundary, selectedHospital, routeData, location) => {
    if (routeData && selectedHospital) {
      setRoutedHospital(selectedHospital);
      setRoute(routeData);
      setUserLocation(location);
      setActiveMap("hospital_route");
    } else {
      setHospitals(newHospitals || []);
      setHospitalBoundary(newBoundary || null);
      setActiveMap("hospital");
    }
  };

  const updateMortalityMap = (boundary, data) => {
    setMortalityBoundary(boundary || null);
    setMortalityData(data || null);
    setActiveMap("mortality");
  };

  const updateHealthIndicatorMap = (boundary, data, classification) => {
    setHealthIndicatorBoundary(boundary || null);
    setHealthIndicatorData(data || null);
    setClassificationData(classification || []);
    setActiveMap("healthIndicator");
  };

  return (
    <div className="flex flex-row w-full h-screen bg-gray-100">
      <Chatbot
        onSearch={updateHospitalMap}
        onMortalitySearch={updateMortalityMap}
        onHealthIndicatorSearch={updateHealthIndicatorMap}
      />
      <div style={{ position: "absolute", right: 0, top: 0, width: "50%" }}>
        <h1 style={{ textAlign: "center" }}>Chatbot</h1>
      </div>

      <div className="map-container">
        <ErrorBoundary>
          {activeMap === "hospital" && hospitalBoundary ? (
            <HospitalMap hospitals={hospitals} boundary={hospitalBoundary} />
          ) : activeMap === "hospital_route" && routedHospital && route && userLocation ? (
            <HospitalRouteMap
              hospital={routedHospital}
              route={route}
              userLocation={userLocation}
            />
          ) : activeMap === "mortality" && mortalityBoundary ? (
            <MortalityMap data={mortalityData} boundary={mortalityBoundary} />
          ) : activeMap === "healthIndicator" && healthIndicatorBoundary ? (
            <HealthIndicatorMap
              data={healthIndicatorData}
              boundary={healthIndicatorBoundary}
              classification_data={classificationData}
            />
          ) : (
            <DefaultMap />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
