## RAG-based Question Answering Chatbot

This is a Retrieval-Augmented Generation (RAG) chatbot that allows users to upload a PDF, ask questions based on its contents, and receive intelligent answers powered by Google's Gemini API. The project consists of a Python-Flask backend and a Next.js frontend with real-time session handling and chat capabilities.

---

## Features

- 📄 Upload PDF and ask contextual questions
- 🧠 Uses HuggingFace embeddings and FAISS for context retrieval
- 🤖 Chat interface powered by Google Gemini
- 🔁 Asynchronous session processing with status polling
- 🧪 Backend can be tested independently with a sample PDF

---

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Python, Flask
- **LLM**: Google Gemini
- **Embeddings**: HuggingFace Transformers
- **Vector Store**: FAISS
- **PDF Parsing**: PyPDF2

---

## Project Structure

```
rag-chatbot/
├── backend/
│   ├── backend.py          # Standalone script to test backend logic using sample PDF
│   ├── server.py           # Flask server handling API requests from frontend
│   ├── jahanzeb_story.pdf # Sample PDF for testing
│   ├── requirements.txt    # Backend dependencies
│   └── .env                # (Not included) contains GEMINI_API_KEY
├── frontend/
│   └── app/
│       └── page.tsx        # Frontend interface
└── README.md               # This file
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rag-chatbot.git
cd rag-chatbot
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or use venv\Scripts\activate on Windows

pip install -r requirements.txt
```

Create a `.env` file and add your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key
```

To run the backend with Flask and connect to the frontend:

```bash
python server.py
```

To test the backend independently with a sample PDF (`jahanzeb_story.pdf`):

```bash
python backend.py
```

This starts a loop that lets you chat via terminal based on the embedded PDF.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

This starts the frontend at `http://localhost:3000`.

---

## How It Works

1. **PDF Upload**  
   User uploads a PDF via the frontend interface.  
   ➜ Triggers a `POST /upload` request to the backend.

2. **Session Initialization**

   - PDF is saved temporarily on the server
   - A `session_id` is returned to the frontend
   - An async task starts:
     - Loads the PDF using PyPDF
     - Generates embeddings using HuggingFace
     - Stores vectors in FAISS
     - Initiates a chat session with Gemini

3. **Status Polling**  
   Frontend polls `GET /session_status?session_id=...` every 2 seconds  
   ➜ Returns `ready: true` when processing is complete

4. **Chat Interaction**  
   User sends a message → `POST /chat` with `session_id` and question
   - Backend retrieves relevant context
   - Forms a prompt
   - Sends it to Gemini and gets a response
   - Response is returned and displayed as the chatbot's reply

---

## Environment Variables

Create a `.env` file in the `backend/` folder:

```
API_KEY=your_gemini_api_key
```

> **Note:** The `.env` file is not included in the repository and must be created manually.

---

## Notes

- `backend.py` is useful for quick, standalone testing of the RAG + Gemini pipeline using a predefined PDF.
- `server.py` is the main backend entry point for full integration with the Next.js frontend.
- You must use your own Gemini API key.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- [HuggingFace Transformers](https://huggingface.co/transformers/)
- [FAISS](https://github.com/facebookresearch/faiss)
- [Google Gemini API](https://ai.google.dev/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---
