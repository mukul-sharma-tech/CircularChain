# app_rag.py
import os
import uuid
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List

# LangChain Gemini wrapper (same as your earlier code)
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Chroma for VectorDB and sentence-transformers for embeddings
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

load_dotenv()

# ----------------- Config -----------------
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db")  # local persistence
EMBED_MODEL_NAME = os.getenv("EMBED_MODEL_NAME", "all-MiniLM-L6-v2")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
TOP_K = int(os.getenv("RAG_TOP_K", "3"))

# ----------------- App Setup -----------------
app = Flask(__name__)
CORS(app)

# ----------------- Simple Knowledge Base (default) -----------------
# You can extend ingest to read from files; we keep this as default content.
default_docs = [
    {
        "id": "kb_1",
        "text": """
The textile recycling industry in India, particularly around hubs like Panipat, is a multi-billion dollar sector.
Textile scraps, known as 'katran', are not waste but a primary raw material.
Key business models include:
1. Manufacturing of 'shoddy yarn': This is recycled yarn from cotton/woolen scraps used for cheap blankets, rugs, and mops. A small-scale plant can be set up with an initial investment of 20-50 Lakhs INR.
2. Production of Industrial Wipes: Low-quality, absorbent textile scraps are cut and sold as industrial cleaning cloths ('pochha'). This is a high-volume, low-margin business.
3. Manufacturing of Soundproofing/Insulation Materials: Denim and other heavy cotton scraps are shredded and compressed into panels for buildings and vehicles. This is a higher-value market.
4. Filler Material: Shredded textile waste is used as a filling for toys, cushions, and mattresses, replacing virgin polyester fiber.
The average procurement price for good quality cotton scraps in Delhi NCR is around ₹30-40 per kg.
"""
    }
]

# ----------------- System Persona Template -----------------
system_template = """
You are CircularSage, an expert business consultant and innovation strategist for the Indian circular economy.
You are positive, encouraging, and provide actionable, data-driven advice.
Your goal is to help users see the business opportunity in industrial waste materials.
When a user asks for business ideas, use the provided knowledge base to give specific, practical examples relevant to the Indian market.
Structure your answers clearly with headings, bullet points, and estimated costs or market values where possible.
Always start your response with a confident, encouraging statement.

Context (retrieved relevant passages):
{context}

Conversation history (most recent first):
{history}

Question:
{question}
"""

# ----------------- Vector DB and Embedding Model Init -----------------
print("Initializing embedding model and Chroma... (this may take a few seconds on first run)")
embed_model = SentenceTransformer(EMBED_MODEL_NAME)

chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

# Create or get a collection called 'circularsage'
COLLECTION_NAME = "circularsage"
try:
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
except Exception:
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

# ----------------- Simple in-memory session memory -----------------
# Structure: { session_id: [ {"role": "user"/"assistant", "text": "..."} , ... ] }
conversation_memory = {}

# ----------------- Utility functions -----------------
def embed_texts(texts: List[str]):
    """Return embedding vectors for a list of texts using sentence-transformers."""
    return embed_model.encode(texts, show_progress_bar=False).tolist()

def ingest_documents(docs: List[dict], namespace: str = "default"):
    """
    Ingest a list of dicts with fields {id, text} into chroma collection.
    Overwrites existing IDs if present.
    """
    ids = [d["id"] for d in docs]
    texts = [d["text"] for d in docs]
    embeddings = embed_texts(texts)
    # Use metadatas if you want extra info
    metadatas = [{"source": d.get("source", "kb")} for d in docs]
    collection.upsert(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas
    )
    # Removed chroma_client.persist() as it's not needed with PersistentClient
    return {"ingested": len(ids)}

def retrieve_relevant(query: str, top_k: int = TOP_K) -> List[str]:
    """Retrieve top_k relevant document passages (raw text) for the query."""
    q_emb = embed_model.encode([query], show_progress_bar=False)[0].tolist()
    result = collection.query(
        query_embeddings=[q_emb],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )
    # result["documents"] is list-of-lists for each query; we only had one query
    docs = result.get("documents", [[]])[0]
    return docs

def build_history_text(session_id: str, max_turns: int = 6):
    """Concatenate recent conversation turns (most recent first) into a single string for the prompt."""
    turns = conversation_memory.get(session_id, [])[-max_turns:]
    # We'll show most recent first
    history_lines = []
    for turn in turns:
        role = turn["role"]
        text = turn["text"]
        history_lines.append(f"{role.upper()}: {text}")
    # join with two newlines
    return "\n\n".join(reversed(history_lines))  # reversed to show most recent last (readable)

# ----------------- LangChain / Gemini Setup -----------------
llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, temperature=0.2)
prompt = ChatPromptTemplate.from_template(system_template)
# Using the same RAG chain pattern as before; we'll provide a retriever function below.

def create_rag_chain_with_retriever(retriever):
    chain = (
        {
            "context": retriever,
            "question": lambda x: x["question"],
            "history": lambda x: x.get("history", "")
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain

# We'll create a retriever wrapper that accepts the question and returns joined relevant passages
def chroma_retriever(question: str):
    docs = retrieve_relevant(question, top_k=TOP_K)
    # Join docs into a single context string (you can add document separators and metadata)
    joined = "\n\n---\n\n".join(docs) if docs else ""
    return joined

rag_chain = create_rag_chain_with_retriever(chroma_retriever)

# ----------------- Flask Endpoints -----------------

@app.route("/api/ingest", methods=["POST"])
def api_ingest():
    """
    Ingest JSON payload: { "docs": [ { "id": "...", "text": "...", "source": "..." }, ... ] }
    If omitted, will ingest the default_docs.
    """
    payload = request.get_json(silent=True) or {}
    docs = payload.get("docs", default_docs)
    result = ingest_documents(docs)
    return jsonify(result)

@app.route("/api/reset-memory", methods=["POST"])
def api_reset_memory():
    payload = request.get_json(silent=True) or {}
    session_id = payload.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    conversation_memory.pop(session_id, None)
    return jsonify({"status": "ok", "session_id": session_id})

@app.route("/api/ask-sage", methods=["POST"])
def api_ask_sage():
    """
    Main endpoint.
    Expected JSON: { "query": "...", "session_id": "optional-uuid" }
    Returns: { "answer": "..." , "session_id": "..." }
    """
    data = request.get_json(silent=True) or {}
    question = data.get("query")
    if not question:
        return jsonify({"error": "Query is required."}), 400

    session_id = data.get("session_id") or str(uuid.uuid4())

    # ensure memory exists
    if session_id not in conversation_memory:
        conversation_memory[session_id] = []

    # Append user's question to memory
    conversation_memory[session_id].append({"role": "user", "text": question})

    # Build context from Chroma
    retrieved_context = chroma_retriever(question)

    # Build conversation history string
    history_text = build_history_text(session_id, max_turns=8)

    # Create the inputs mapping expected by the chain
    inputs = {"context": retrieved_context, "question": question, "history": history_text}

    try:
        # Invoke the chain synchronously (this returns a string because of StrOutputParser)
        response = rag_chain.invoke(inputs)
        # Append assistant response to memory
        conversation_memory[session_id].append({"role": "assistant", "text": response})
        return jsonify({"answer": response, "session_id": session_id})
    except Exception as e:
        print("Error invoking RAG chain:", str(e))
        return jsonify({"error": "Failed to get a response from the AI.", "details": str(e)}), 500

# ----------------- Start / Ingest at startup -----------------
if __name__ == "__main__":
    # Ensure default docs ingested on startup if collection empty
    try:
        # Check if collection has any documents
        result = collection.get()
        count = len(result["ids"])
    except Exception as e:
        # If there's an error getting documents, assume collection is empty
        print(f"Could not check collection status: {e}")
        count = 0

    if count == 0:
        print("Ingesting default documents into ChromaDB...")
        ingest_documents(default_docs)
        print(f"Successfully ingested {len(default_docs)} documents.")
    else:
        print(f"Collection already contains {count} documents.")

    print("Starting Flask app on port 5000")
    app.run(debug=True, port=5000)