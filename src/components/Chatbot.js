import { useState, useRef, useEffect } from "react";

export default function Chatbot({ onSearch, onMortalitySearch,onHealthIndicatorSearch }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null); // Auto-scroll to bottom

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      console.log("API Response:", data);
      console.log("Map type:", data.map_type);

      // Check if the response includes specific data (hospitals and boundary)
      let botResponse = data.response;
if (typeof botResponse === "object" && botResponse.response) {
  botResponse = botResponse.response;
} else if (typeof botResponse === "object") {
  botResponse = JSON.stringify(botResponse, null, 2);
}

if (data.hospitals || (data.boundary && data.map_type === "hospital")) {
  console.log("Sending data to map:", data.hospitals, data.boundary);
  onSearch(data.hospitals || [], data.boundary || null);
}

if (data.boundary && data.map_type === "mortality") {
  console.log("Updating mortality map:", data.boundary, data.county_names, data.indicator,data.indicator_value);
  onMortalitySearch(data.boundary, {
    county_name: data.county_names,
    indicator:data.indicator,
    indicator_value:data.indicator_value,
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

  return (
    <div className="chatbot-container">
      {/* Chat Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input field & search button */}
      <div className="chat-input-container">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about hospitals..."
          className="chat-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuery();
            }
          }}
        />
        <button onClick={handleQuery} className="chat-button">Send</button>
      </div>
    </div>
  );
}
