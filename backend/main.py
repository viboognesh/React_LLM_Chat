from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import aiofiles

from dotenv import load_dotenv

from langchain_community.document_loaders import TextLoader, Docx2txtLoader, PyPDFLoader
from langchain.prompts import ChatPromptTemplate, PromptTemplate
from langchain.prompts import SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.memory import ConversationBufferMemory
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import ConversationalRetrievalChain

load_dotenv()

app = FastAPI()

# origins = ["https://viboognesh-react-chat.static.hf.space"]
origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ConversationChainManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ConversationChainManager, cls).__new__(
                cls, *args, **kwargs
            )
        return cls._instance

    def __init__(self):
        self.conversation_chain = None
        self.llm_model = ChatOpenAI()
        self.embeddings = OpenAIEmbeddings()

    def create_conversational_chain(self, file_paths: List[str]):
        docs = self.get_docs(file_paths)
        memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )
        vectordb = Chroma.from_documents(
            docs,
            self.embeddings,
        )
        retriever = vectordb.as_retriever()
        self.conversation_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm_model,
            retriever=retriever,
            condense_question_prompt=self.get_question_generator_prompt(),
            combine_docs_chain_kwargs={
                "document_prompt": self.get_document_prompt(),
                "prompt": self.get_final_prompt(),
            },
            memory=memory,
        )

    @staticmethod
    def get_docs(file_paths: List[str]) -> List:
        docs = []
        for file_path in file_paths:
            if file_path.endswith(".txt"):
                loader = TextLoader(file_path)
                document = loader.load()
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000, chunk_overlap=100
                )
                txt_documents = splitter.split_documents(document)
                docs.extend(txt_documents)
            elif file_path.endswith(".csv"):
                loader = CSVLoader(file_path)
                csv_documents = loader.load()
                docs.extend(csv_documents)
            elif file_path.endswith(".docx"):
                loader = Docx2txtLoader(file_path)
                document = loader.load()
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000, chunk_overlap=100
                )
                docx_documents = splitter.split_documents(document)
                docs.extend(docx_documents)
            elif file_path.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
                pdf_documents = loader.load_and_split()
                docs.extend(pdf_documents)
            os.remove(file_path)
        return docs

    @staticmethod
    def get_document_prompt() -> PromptTemplate:
        document_template = """Document Content:{page_content}
    Document Path: {source}"""
        return PromptTemplate(
            input_variables=["page_content", "source"],
            template=document_template,
        )

    @staticmethod
    def get_question_generator_prompt() -> PromptTemplate:
        question_generator_template = """Combine the chat history and follow up question into
    a standalone question.\n Chat History: {chat_history}\n
    Follow up question: {question}
    """
        return PromptTemplate.from_template(question_generator_template)

    @staticmethod
    def get_final_prompt() -> ChatPromptTemplate:
        final_prompt_template = """Answer question based on the context and chat_history.
    If you cannot find answers, ask more related questions from the user.
    Use only the basename of the file path as name of the documents.
    Mention document name of the documents you used in your answer.

    context:
    {context}

    chat_history:
    {chat_history}

    question:
    {question}

    Answer:
    """

        messages = [
            SystemMessagePromptTemplate.from_template(final_prompt_template),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]

        return ChatPromptTemplate.from_messages(messages)


app.state.conversational_chain_manager = ConversationChainManager()


@app.post("/upload_files/")
async def upload_files(
    files: List[UploadFile] = File(...),
    conversation_chain_manager: ConversationChainManager = Depends(
        lambda: app.state.conversational_chain_manager
    ),
):
    session_folder = f"uploads"
    os.makedirs(session_folder, exist_ok=True)
    file_paths = []
    for file in files:
        file_path = f"{session_folder}/{file.filename}"
        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        file_paths.append(file_path)

    conversation_chain_manager.create_conversational_chain(file_paths)
    print("conversational_chain_manager created")
    return {"message": "ConversationalRetrievalChain is created. Please ask questions."}


@app.get("/predict/")
async def predict(
    query: str,
    conversation_chain_manager: ConversationChainManager = Depends(
        lambda: app.state.conversational_chain_manager
    ),
):
    if conversation_chain_manager.conversation_chain is None:
        system_prompt = "Answer the question and also ask the user to upload files to ask questions from the files.\n"
        response = conversation_chain_manager.llm_model.invoke(system_prompt + query)
        answer = response.content
    else:
        response = conversation_chain_manager.conversation_chain.invoke(query)
        answer = response["answer"]

    print("predict called")
    return {"answer": answer}
