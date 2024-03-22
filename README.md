# React_LLM_Chat

run 
cd backend
uvicorn main:app --reload

and in another power shell terminal
cd frontend
serve -s build

frontend host url
in main.py
  origins = ["http://localhost:3000"]

backend url
in api.js
    baseURL: "http://127.0.0.1:8000"

Please change this according to your local deployment configuration.
If you change the backend url in api.js, please run

npm run build

before serve -s build to make changes.

There is no backend file management. This was an intentional choice.
I thought the file creation was the problem that caused webapp deployment to fail.
So, I created a ephemeral chroma database and deleted the files after creating the chroma retriever.
I was wrong. I will check and try to fix the issue.

In case webapp url is not working, please check this one locally.

Also don't forget to add your OpenAI API Key in the .env file in the backend folder.