import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Load environment variables from .env file
load_dotenv()

# --- App Setup ---
app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing your frontend to connect

# --- RAG & AI Persona Setup ---

# This is our "RAG" cheat sheet for the hackathon.
# In a full application, this would come from a dynamic vector database.
knowledge_base = """
  The textile recycling industry in India, particularly around hubs like Panipat, is a multi-billion dollar sector.
  Textile scraps, known as 'katran', are not waste but a primary raw material.
  Key business models include:
  1.  Manufacturing of 'shoddy yarn': This is recycled yarn from cotton/woolen scraps used for cheap blankets, rugs, and mops. A small-scale plant can be set up with an initial investment of 20-50 Lakhs INR.
  2.  Production of Industrial Wipes: Low-quality, absorbent textile scraps are cut and sold as industrial cleaning cloths ('pochha'). This is a high-volume, low-margin business.
  3.  Manufacturing of Soundproofing/Insulation Materials: Denim and other heavy cotton scraps are shredded and compressed into panels for buildings and vehicles. This is a higher-value market.
  4.  Filler Material: Shredded textile waste is used as a filling for toys, cushions, and mattresses, replacing virgin polyester fiber.
  The average procurement price for good quality cotton scraps in Delhi NCR is around ₹30-40 per kg.
"""

# This is the persona we want our AI to adopt.
system_template = """
  You are CircularSage, an expert business consultant and innovation strategist for the Indian circular economy.
  You are positive, encouraging, and provide actionable, data-driven advice.
  Your goal is to help users see the business opportunity in industrial waste materials.
  When a user asks for business ideas, use the provided knowledge base to give specific, practical examples relevant to the Indian market.
  Structure your answers clearly with headings, bullet points, and estimated costs or market values where possible.
  Always start your response with a confident, encouraging statement.

  Context:
  {context}

  Question:
  {question}
"""

# --- LangChain RAG Chain ---

def create_rag_chain():
    """Creates the LangChain RAG chain."""
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
    prompt = ChatPromptTemplate.from_template(system_template)
    
    # Simple "retriever" for the hackathon: just passes the whole knowledge base.
    retriever = lambda _: knowledge_base

    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain

rag_chain = create_rag_chain()

# --- API Endpoint ---

@app.route('/api/ask-sage', methods=['POST'])
def ask_sage():
    """API endpoint to receive questions and return AI-generated answers."""
    data = request.get_json()
    query = data.get('query')

    if not query:
        return jsonify({"error": "Query is required."}), 400

    try:
        # Get the response from the RAG chain
        response = rag_chain.invoke(query)
        return jsonify({"answer": response})
    except Exception as e:
        print(f"Error invoking RAG chain: {e}")
        return jsonify({"error": "Failed to get a response from the AI."}), 500

if __name__ == '__main__':
    # Runs the Flask app. Debug=True allows for auto-reloading when you save changes.
    app.run(debug=True, port=5000)
