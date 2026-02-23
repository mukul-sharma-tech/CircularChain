//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           query: query,
//           session_id: sessionId === "Not started" ? null : sessionId,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Request failed");
//       }

//       if (data.session_id) {
//         setSessionId(data.session_id);
//       }

//       addMessage(data.answer);
//       showStatus("Response received successfully", "success");
//     } catch (error) {
//       console.error("Error:", error);
//       addMessage(`Error: ${error.message}`);
//       showStatus(`Error: ${error.message}`, "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resetMemory = async () => {
//     if (sessionId === "Not started") {
//       showStatus("No active session to reset", "error");
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE}/api/reset-memory`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           session_id: sessionId,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Reset failed");
//       }

//       showStatus("Conversation memory reset successfully", "success");
//       addMessage("Conversation history has been reset. How can I help you with circular economy opportunities?");
//     } catch (error) {
//       console.error("Error:", error);
//       showStatus(`Error resetting memory: ${error.message}`, "error");
//     }
//   };

//   const ingestDocuments = async () => {
//     if (!docText.trim()) {
//       showStatus("Please enter document content", "error");
//       return;
//     }

//     let payload;
//     try {
//       payload = JSON.parse(docText);
//     } catch (e) {
//       payload = {
//         docs: [
//           {
//             id: `custom_${Date.now()}`,
//             text: docText,
//             source: "manual",
//           },
//         ],
//       };
//     }

//     try {
//       const response = await fetch(`${API_BASE}/api/ingest`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Ingestion failed");
//       }

//       showStatus(`Successfully ingested ${data.ingested} document(s)`, "success");
//       setDocText("");
//     } catch (error) {
//       console.error("Error:", error);
//       showStatus(`Error ingesting documents: ${error.message}`, "error");
//     }
//   };

//   const testConnection = async () => {
//     try {
//       const response = await fetch(`${API_BASE}/api/ask-sage`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           query: "Hello, are you working?",
//         }),
//       });

//       if (response.ok) {
//         showStatus("✅ API connection successful!", "success");
//       } else {
//         showStatus("❌ API connection failed", "error");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       showStatus(`❌ Connection test failed: ${error.message}`, "error");
//     }
//   };

//   const clearChat = () => {
//     setMessages([
//       {
//         role: "assistant",
//         content:
//           "Hello! I'm your AI consultant for India's circular economy. Ask me about business opportunities in waste materials, textile recycling, or any sustainability-focused ventures!",
//       },
//     ]);
//     showStatus("Chat display cleared", "info");
//   };

//   const exampleQueries = [
//     "What are the best business opportunities in textile waste recycling in India?",
//     "How much investment is needed to start a shoddy yarn manufacturing business?",
//     "What is the current market price for textile scraps in Delhi?",
//     "Can you suggest some high-value applications for denim waste?",
//   ];

//   return (
// <div className="bg-transparent text-slate-100">
//   {/* Header */}
//   <div className="container mx-auto max-w-7xl">
//     {/* Status Message */}
//     {status.message && (
//       <div
//         className={`p-4 rounded-2xl mb-8 ${status.type === "error"
//             ? "bg-red-500/10 border border-red-500/20 text-red-400"
//             : status.type === "success"
//               ? "bg-green-500/10 border border-green-500/20 text-green-400"
//               : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
//           }`}
//       >
//         {status.message}
//       </div>
//     )}

//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//       {/* Chat Section */}
//       <div className="glass-panel p-8 rounded-3xl">
//         <h2 className="text-2xl font-black mb-1 text-gradient flex items-center">
//           CircularSage AI
//         </h2>
//         <p className="text-slate-400 mb-8 text-sm font-medium opacity-80 uppercase tracking-widest">Global Sustainability Consultant</p>


//             <div className="bg-gray-900/50 p-4 rounded-lg mb-4 font-mono text-sm">
//               <strong>Session ID:</strong> {sessionId}
//             </div>

//             <div
//               ref={chatContainerRef}
//               className="h-96 border-2 border-gray-700 rounded-lg p-4 mb-4 overflow-y-auto bg-gray-900/30"
//             >
//               {messages.map((message, index) => (
//                 <div
//                   key={index}
//                   className={`p-3 rounded-lg mb-3 max-w-[85%] ${
//                     message.role === "user"
//                       ? "bg-teal-500/20 border border-teal-500/30 ml-auto text-right"
//                       : "bg-gray-700/50 border border-gray-600"
//                   }`}
//                 >
//                   <strong>{message.role === "user" ? "You: " : "CircularSage: "}</strong>
//                   {message.content}
//                 </div>
//               ))}
//               {isLoading && (
//                 <div className="p-3 rounded-lg mb-3 bg-gray-700/50 border border-gray-600 w-1/2">
//                   <div className="flex items-center">
//                     <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal-400 mr-2"></div>
//                     <span>Thinking...</span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="flex space-x-2 mb-6">
//               <input
//                 type="text"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 onKeyPress={(e) => e.key === "Enter" && sendQuery()}
//                 placeholder="Ask about business opportunities in waste materials..."
//                 className="flex-1 bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
//               />
//               <button
//                 onClick={sendQuery}
//                 className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-gray-900 font-bold py-2 px-6 rounded-lg transition-all duration-300"
//               >
//                 <i className="fas fa-paper-plane mr-2"></i> Send
//               </button>
//             </div>

//             <div className="mb-6">
//               <h3 className="text-lg font-semibold mb-3 text-teal-300">
//                 <i className="fas fa-lightbulb mr-2"></i>Try these example questions:
//               </h3>
//               <div className="grid grid-cols-1 gap-2">
//                 {exampleQueries.map((example, index) => (
//                   <div
//                     key={index}
//                     onClick={() => setQuery(example)}
//                     className="bg-gray-700/40 hover:bg-gray-700/70 border border-gray-600 rounded-lg p-3 text-sm cursor-pointer transition-colors duration-200"
//                   >
//                     {example}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Admin Section */}
//           <div className="bg-gray-800/40 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
//             <h2 className="text-xl font-bold mb-4 text-teal-400 flex items-center">
//               <i className="fas fa-cog mr-2"></i>
//               Admin Controls
//             </h2>

//             <div className="space-y-6">
//               {/* Reset Conversation */}
//               <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
//                 <h3 className="font-semibold mb-2 text-teal-300">
//                   <i className="fas fa-sync mr-2"></i>Reset Conversation
//                 </h3>
//                 <p className="text-gray-400 text-sm mb-3">Clear the current conversation history</p>
//                 <button
//                   onClick={resetMemory}
//                   className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 w-full"
//                 >
//                   Reset Memory
//                 </button>
//               </div>

//               {/* Add Knowledge */}
//               <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
//                 <h3 className="font-semibold mb-2 text-teal-300">
//                   <i className="fas fa-book mr-2"></i>Add Knowledge
//                 </h3>
//                 <p className="text-gray-400 text-sm mb-3">Ingest new documents into the knowledge base</p>
//                 <textarea
//                   value={docText}
//                   onChange={(e) => setDocText(e.target.value)}
//                   placeholder='Enter document text or JSON format:
// {
//   "docs": [
//     {
//       "id": "custom_1",
//       "text": "Your knowledge content here...",
//       "source": "manual"
//     }
//   ]
// }'
//                   className="w-full bg-gray-700/60 border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3 min-h-[120px]"
//                 />
//                 <button
//                   onClick={ingestDocuments}
//                   className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition-all duration-300 w-full"
//                 >
//                   Ingest Documents
//                 </button>
//               </div>

//               {/* Test Connection */}
//               <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
//                 <h3 className="font-semibold mb-2 text-teal-300">
//                   <i className="fas fa-wifi mr-2"></i>Test Connection
//                 </h3>
//                 <p className="text-gray-400 text-sm mb-3">Verify API connectivity</p>
//                 <button
//                   onClick={testConnection}
//                   className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 w-full"
//                 >
//                   Test API
//                 </button>
//               </div>

//               {/* Clear Chat */}
//               <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
//                 <h3 className="font-semibold mb-2 text-teal-300">
//                   <i className="fas fa-trash mr-2"></i>Clear Chat
//                 </h3>
//                 <p className="text-gray-400 text-sm mb-3">Clear the chat display (local only)</p>
//                 <button
//                   onClick={clearChat}
//                   className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 w-full"
//                 >
//                   Clear Display
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//     </div>
//   );
// }

"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion"; // Added motion import

// Type definitions
interface Message {
  role: "assistant" | "user";
  content: string;
}

interface StatusState {
  message: string;
  type: "info" | "success" | "error" | "";
}

interface AskSageRequest {
  query: string;
  session_id?: string | null;
}

interface AskSageResponse {
  answer: string;
  session_id?: string;
  error?: string;
}

interface ResetMemoryRequest {
  session_id: string;
}

interface ResetMemoryResponse {
  message?: string;
  error?: string;
}

interface DocumentToIngest {
  id: string;
  text: string;
  source: string;
}

interface IngestRequest {
  docs: DocumentToIngest[];
}

interface IngestResponse {
  ingested: number;
  error?: string;
}

export default function CircularSagePage() {
  const [query, setQuery] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("Not started");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI consultant for India's circular economy. Ask me about business opportunities in waste materials, textile recycling, or any sustainability-focused ventures!",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>({ message: "", type: "" });
  const [docText, setDocText] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const showStatus = (message: string, type: StatusState["type"] = "info"): void => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: "", type: "" }), 5000);
  };

  const addMessage = (content: string, role: Message["role"] = "assistant"): void => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const sendQuery = async (): Promise<void> => {
    if (!query.trim()) {
      showStatus("Please enter a question", "error");
      return;
    }

    addMessage(query, "user");
    setIsLoading(true);
    setQuery("");

    try {
      const requestBody: AskSageRequest = {
        query: query,
        session_id: sessionId === "Not started" ? null : sessionId,
      };

      const response = await fetch(`${API_BASE}/api/ask-sage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: AskSageResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      addMessage(data.answer);
      showStatus("Response received successfully", "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error:", error);
      addMessage(`Error: ${errorMessage}`);
      showStatus(`Error: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetMemory = async (): Promise<void> => {
    if (sessionId === "Not started") {
      showStatus("No active session to reset", "error");
      return;
    }

    try {
      const requestBody: ResetMemoryRequest = {
        session_id: sessionId,
      };

      const response = await fetch(`${API_BASE}/api/reset-memory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: ResetMemoryResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reset failed");
      }

      showStatus("Conversation memory reset successfully", "success");
      addMessage("Conversation history has been reset. How can I help you with circular economy opportunities?");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error:", error);
      showStatus(`Error resetting memory: ${errorMessage}`, "error");
    }
  };

  const ingestDocuments = async (): Promise<void> => {
    if (!docText.trim()) {
      showStatus("Please enter document content", "error");
      return;
    }

    let payload: IngestRequest;
    try {
      payload = JSON.parse(docText) as IngestRequest;
    } catch {
      payload = {
        docs: [
          {
            id: `custom_${Date.now()}`,
            text: docText,
            source: "manual",
          },
        ],
      };
    }

    try {
      const response = await fetch(`${API_BASE}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: IngestResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ingestion failed");
      }

      showStatus(`Successfully ingested ${data.ingested} document(s)`, "success");
      setDocText("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error:", error);
      showStatus(`Error ingesting documents: ${errorMessage}`, "error");
    }
  };

  const testConnection = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/api/ask-sage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "Hello, are you working?",
        }),
      });

      if (response.ok) {
        showStatus("✅ API connection successful!", "success");
      } else {
        showStatus("❌ API connection failed", "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error:", error);
      showStatus(`❌ Connection test failed: ${errorMessage}`, "error");
    }
  };

  const clearChat = (): void => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your AI consultant for India's circular economy. Ask me about business opportunities in waste materials, textile recycling, or any sustainability-focused ventures!",
      },
    ]);
    showStatus("Chat display cleared", "info");
  };

  return (
    <div className="bg-transparent text-slate-100">
      <div className="container mx-auto max-w-7xl">
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl mb-8 ${status.type === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" :
              status.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" :
                "bg-blue-500/10 border border-blue-500/20 text-blue-400"
              }`}
          >
            {status.message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chat Section */}
          <div className="glass-panel p-8 rounded-3xl">
            <h2 className="text-2xl font-black mb-1 text-gradient">CircularSage AI</h2>
            <p className="text-slate-400 mb-8 text-sm font-medium opacity-80 uppercase tracking-widest leading-none">Sustainability Intelligence</p>

            <div className="glass-card p-4 rounded-xl mb-6 bg-white/5 border-white/5 font-mono text-xs text-slate-500">
              <span className="opacity-50">SESSION_ID:</span> {sessionId}
            </div>

            <div ref={chatContainerRef} className="h-[450px] space-y-4 mb-6 overflow-y-auto pr-2 custom-scrollbar">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl max-w-[90%] ${message.role === "user"
                    ? "bg-teal-500 text-slate-900 ml-auto font-medium shadow-lg shadow-teal-500/10"
                    : "bg-slate-800/50 border border-slate-700/50 backdrop-blur-md"
                    }`}
                >
                  <div className="text-[10px] opacity-40 mb-1 font-bold uppercase tracking-widest">
                    {message.role === "user" ? "Client" : "Sage Analyst"}
                  </div>
                  <div className="leading-relaxed text-sm md:text-base">{message.content}</div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl w-fit">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Processing</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendQuery()}
                placeholder="Ask about circular economies..."
                className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm"
              />
              <button
                onClick={sendQuery}
                className="bg-teal-500 hover:bg-teal-400 text-slate-900 p-4 rounded-2xl transition-all shadow-lg shadow-teal-500/20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-6">
            <div className="glass-panel p-8 rounded-3xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-100">
                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                Intelligence Controls
              </h3>

              <div className="grid gap-4">
                <button
                  onClick={resetMemory}
                  className="w-full glass-card p-4 rounded-2xl text-left hover:bg-blue-500/10 hover:border-blue-500/30 group transition-all"
                >
                  <div className="text-blue-400 font-bold mb-1">Reset Memory</div>
                  <div className="text-xs text-slate-500">Purge local session history and neural cache.</div>
                </button>

                <button
                  onClick={testConnection}
                  className="w-full glass-card p-4 rounded-2xl text-left hover:bg-purple-500/10 hover:border-purple-500/30 group transition-all"
                >
                  <div className="text-purple-400 font-bold mb-1">System Audit</div>
                  <div className="text-xs text-slate-500">Verify API gateway and blockchain connectivity.</div>
                </button>

                <button
                  onClick={clearChat}
                  className="w-full glass-card p-4 rounded-2xl text-left hover:bg-red-500/10 hover:border-red-500/30 group transition-all"
                >
                  <div className="text-red-400 font-bold mb-1">Clear HUD</div>
                  <div className="text-xs text-slate-500">Wipe the visual interface but keep session.</div>
                </button>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-100">
                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                Knowledge Ingestion
              </h3>
              <textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Insert document data (JSON or Raw Text)..."
                className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 mb-4 text-slate-300"
              />
              <button
                onClick={ingestDocuments}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
              >
                Incorporate Knowledge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
