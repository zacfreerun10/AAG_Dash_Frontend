import { useState, useRef, useEffect } from "react";


const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;


export default function Chatbot({ onSearch, onMortalitySearch, onHealthIndicatorSearch }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [detectedCounty, setDetectedCounty]= useState(null);
  const mediaRecorderRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords=[position.coords.latitude, position.coords.longitude]
          setUserLocation(coords);
          console.log("📍 User location set:", position.coords);
          const county= await fetchCountyFromCoordinates (coords [0], coords[1]);
          if (county) {
            console.log ("Detected county:", county);
            setDetectedCounty (county);
          }
        },
        (error) => {
          console.warn("⚠️ Error getting user location:", error);
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
    }
  }, []);

  const fetchCountyFromCoordinates = async (lat, lon) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?types=district&access_token=${MAPBOX_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const countyFeature = data.features.find(f => f.place_type.includes("district"));
      return countyFeature?.text || null;
    } catch (error) {
      console.error("Error fetching county:", error);
      return null;
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    const newMessages = [...messages, { text: query, type: "user" }];
    setMessages(newMessages);
    setQuery("");

    console.log("Sending API request...");
    try {
      const res = await fetch("https://aag-dash.onrender.com/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          user_lat: userLocation ? userLocation[0] : null,
          user_lon: userLocation ? userLocation[1] : null,
          detected_county: detectedCounty,
          history: newMessages.map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.text,
          })),
        }),
      });

      const data = await res.json();
      console.log("API Response:", data);
      console.log("Map type:", data.map_type);

      let botResponse = data.response;
      if (typeof botResponse === "object" && botResponse.response) {
        botResponse = botResponse.response;
      } else if (typeof botResponse === "object") {
        botResponse = JSON.stringify(botResponse, null, 2);
      }

      if (data.map_type === "hospital_route") {
        console.log("Displaying hospital route:", data.hospital, data.route);
        onSearch([], null, data.hospital, data.route, userLocation ? [userLocation[1], userLocation[0]] : null);
      } else if (data.hospitals || (data.boundary && data.map_type === "hospital")) {
        console.log("Sending hospital list to map:", data.hospitals, data.boundary);
        onSearch(data.hospitals || [], data.boundary || null);
      }

      if (data.boundary && data.map_type === "mortality") {
        console.log("Updating mortality map:", data.boundary, data.county_names, data.indicator, data.indicator_value);
        onMortalitySearch(data.boundary, {
          county_name: data.county_names,
          indicator: data.indicator,
          indicator_value: data.indicator_value,
        });
      }

      if (data.boundary && data.map_type === "healthIndicator") {
        console.log("Updating health indicator map:", data.boundary, data.classification_data);
        onHealthIndicatorSearch(data.boundary, data.healthIndicatorData, data.classification_data);
      }

      setMessages([...newMessages, { text: botResponse, type: "bot" }]);
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
      setMessages([...newMessages, { text: "Error: Unable to reach chatbot", type: "bot" }]);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setAudioBlob(null);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      setAudioBlob(audioBlob);
      sendAudioToOpenAI(audioBlob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const sendAudioToOpenAI = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-1");

    console.log("Sending audio for transcription...");

    try {
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log("Transcription:", data);
      if (data.text) {
        setQuery(data.text);
        handleQuery();
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask or speak about health data related queries..."
          className="chat-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuery();
            }
          }}
        />
        <button onClick={handleQuery} className="chat-button">Send</button>
        {isRecording ? (
          <button onClick={stopRecording} className="chat-button">⏹</button>
        ) : (
          <button onClick={startRecording} className="chat-button">🔊</button>
        )}
      </div>
    </div>
  );
}
