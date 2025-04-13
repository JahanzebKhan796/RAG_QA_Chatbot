"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [userInput, setUserInput] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfName(file.name);
      setIsProcessing(true);
      setIsReady(false);
      setMessages([]);

      // Upload PDF to the API
      const formData = new FormData();
      formData.append("pdf", file);

      try {
        const response = await fetch("http://127.0.0.1:5000/upload_pdf", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        setSessionId(data.session_id);
        setStatus(data.status);

        // Start checking status every 2 seconds
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
        }

        statusCheckInterval.current = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `http://localhost:5000/session_status?session_id=${data.session_id}`
            );
            const statusData = await statusResponse.json();
            setStatus(statusData.status);

            if (statusData.status === "ready") {
              if (statusCheckInterval.current) {
                clearInterval(statusCheckInterval.current);
              }
              setIsProcessing(false);
              setIsReady(true);
              // Add welcome message from bot
              setMessages([
                {
                  sender: "bot",
                  text: "I'm ready to assist you with your PDF. Ask me anything about it!",
                },
              ]);
            }
          } catch (error) {
            console.error("Error checking status:", error);
          }
        }, 2000);
      } catch (error) {
        console.error("Error uploading PDF:", error);
        alert("Failed to upload PDF. Please try again.");
        setIsProcessing(false);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleUserMessage = async () => {
    if (!userInput.trim() || !sessionId || !isReady) return;

    const newMessage = { sender: "user", text: userInput };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setUserInput("");

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: userInput,
        }),
      });

      const data = await response.json();
      const botMessage = {
        sender: "bot",
        text: data.response,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        sender: "bot",
        text: "Sorry, I encountered an error processing your request.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-semibold text-center text-indigo-600 mb-6">
          Upload a PDF
        </h1>

        <div className="text-center mb-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-700 border-2 border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isProcessing}
          />
        </div>

        {pdfName && (
          <div className="mt-4 text-center">
            <p className="text-lg text-gray-800 font-medium">Uploaded PDF:</p>
            <p className="text-xl text-indigo-600">{pdfName}</p>
            {status && (
              <p className="text-sm mt-1">
                Status:{" "}
                <span
                  className={`font-medium ${
                    status === "ready" ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {status}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Chatbot */}
        {pdfName && (
          <div className="mt-8">
            <div className="bg-gray-100 p-4 rounded-lg shadow-lg max-h-64 overflow-y-auto mb-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs text-sm rounded-xl py-2 px-4 ${
                        message.sender === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isProcessing && messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs text-sm rounded-xl py-2 px-4 bg-gray-300 text-gray-800">
                      Processing your PDF, please wait...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleUserMessage()}
                className="flex-1 border-2 border-gray-300 rounded-lg py-2 px-4 text-gray-700"
                placeholder={
                  isReady ? "Type your message..." : "Processing PDF..."
                }
                disabled={!isReady}
              />
              <button
                onClick={handleUserMessage}
                className="ml-2 bg-indigo-600 text-white rounded-lg py-2 px-4 hover:bg-indigo-700 disabled:bg-indigo-300"
                disabled={!isReady || !userInput.trim()}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
