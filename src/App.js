import { useState } from "react";
import Chatbot from "./components/Chatbot";
import HospitalMap from "./components/HospitalMap";
import MortalityMap from "./components/MortalityMap";
import HealthIndicatorMap from "./components/HealthIndicatorMap";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [hospitals, setHospitals] = useState([]);
  const [hospitalBoundary, setHospitalBoundary] = useState(null);

  const [mortalityBoundary, setMortalityBoundary] = useState(null);
  const [mortalityData, setMortalityData] = useState(null);

  const [healthIndicatorBoundary, setHealthIndicatorBoundary] = useState(null);
  const [healthIndicatorData, setHealthIndicatorData] = useState(null);
  const [classificationData, setClassificationData] = useState([]);

  const [activeMap, setActiveMap] = useState(null);

  const updateHospitalMap = (newHospitals, newBoundary) => {
    console.log("Updating Hospital Map Data", newHospitals, newBoundary);
    setHospitals(newHospitals || []);
    setHospitalBoundary(newBoundary || null);
    setActiveMap("hospital");
  };

  const updateMortalityMap = (boundary, data) => {
    console.log("Updating Mortality Map Data", boundary, data);
    setMortalityBoundary(boundary || null);
    setMortalityData(data || null);
    setActiveMap("mortality");
  };

  const updateHealthIndicatorMap = (boundary, data, classification) => {
    console.log("Updating Health Indicator Map Data", boundary, data, classification);
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

      {/* Map Section (Right Side) */}
      <div className="map-container">
        <ErrorBoundary>
          {activeMap === "hospital" && hospitalBoundary && (
            <HospitalMap hospitals={hospitals} boundary={hospitalBoundary} />
          )}
          {activeMap === "mortality" && mortalityBoundary && (
            <MortalityMap data={mortalityData} boundary={mortalityBoundary} />
          )}
          {activeMap === "healthIndicator" && healthIndicatorBoundary && (
            <HealthIndicatorMap
              data={healthIndicatorData}
              boundary={healthIndicatorBoundary}
              classification_data={classificationData}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;