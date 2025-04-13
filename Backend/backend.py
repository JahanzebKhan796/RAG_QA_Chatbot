from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings
from google import genai
from dotenv import load_dotenv
import os


loader = PyPDFLoader("jahanzeb_story.pdf")
documents = loader.load()

#Split into chunks
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
chunks = text_splitter.split_documents(documents)

hf_embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = FAISS.from_documents(chunks, hf_embeddings)

retriever = vectorstore.as_retriever()

load_dotenv()
api_key = os.getenv("API_KEY")

client = genai.Client(api_key=api_key)
chat = client.chats.create(model="gemini-2.0-flash")

x = chat.send_message("Answer only from the context of this chat not from your own knowledge. Give short paragraph answers. ")


print("\n\nStarting the chat (\"exit\" to stop)...\n\n")
while True:
    query = input("You: ")
    if(query.lower() == "exit"):
        break
    
    relevant_context = retriever.invoke(query, k=2)


    context = "\n\n".join([doc.page_content for doc in relevant_context])


    #Create the input prompt with the relevant context and question
    prompt = f"Context:\n{context}\n\nQuestion: {query}"

    response = chat.send_message(prompt)
    print("Chatbot:", end=" ")
    print(response.text)
    