from flask import Flask, request, jsonify
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings
from google import genai
from dotenv import load_dotenv
import os
import uuid
from threading import Thread
from flask_cors import CORS

# Initialize Flask
app = Flask(__name__)
CORS(app)
load_dotenv()

# Globals to store per-session data
SESSIONS = {}

# API key for Gemini
api_key = os.getenv("API_KEY")
genai_client = genai.Client(api_key=api_key)

def process_pdf_async(session_id, pdf_path):
    try:
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)

        hf_embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vectorstore = FAISS.from_documents(chunks, hf_embeddings)
        retriever = vectorstore.as_retriever()

        chat = genai_client.chats.create(model="gemini-2.0-flash")
        chat.send_message("Answer only from the context of this chat not from your own knowledge. Give short paragraph answers.")

        SESSIONS[session_id] = {
            'status': 'ready',
            'retriever': retriever,
            'chat': chat
        }
    except Exception as e:
        print(f"[ERROR] Failed to process PDF for session {session_id}: {e}")
        SESSIONS[session_id] = {'status': 'error', 'error': str(e)}

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF uploaded'}), 400

    pdf_file = request.files['pdf']
    session_id = str(uuid.uuid4())
    
    temp_path = f"/tmp/{session_id}.pdf"
    pdf_file.save(temp_path)

    # Mark session as processing
    SESSIONS[session_id] = {'status': 'processing'}

    # Start background thread
    thread = Thread(target=process_pdf_async, args=(session_id, temp_path))
    thread.start()

    return jsonify({'session_id': session_id, 'status': 'processing'})


@app.route('/session_status', methods=['GET'])
def session_status():
    session_id = request.args.get('session_id')
    session = SESSIONS.get(session_id)

    if not session:
        return jsonify({'status': 'invalid'}), 404

    return jsonify({'status': session.get('status')})


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    session_id = data.get('session_id')
    query = data.get('query')

    if not session_id or session_id not in SESSIONS:
        return jsonify({'error': 'Invalid or missing session_id'}), 400
    session = SESSIONS[session_id]
    
    if session.get('status') != 'ready':
        return jsonify({'error': f'Session not ready. Current status: {session.get("status")}'})

    retriever = session['retriever']
    chat = session['chat']

    relevant_context = retriever.invoke(query, k=2)
    context = "\n\n".join([doc.page_content for doc in relevant_context])
    prompt = f"Context:\n{context}\n\nQuestion: {query}"

    response = chat.send_message(prompt)
    return jsonify({'response': response.text})


if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
