import axios from 'axios'

const api = axios.create({
    // baseURL: "https://viboognesh-fastapibackend.hf.space",
    baseURL: "http://127.0.0.1:8000"
});

export default api;