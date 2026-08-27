from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.6.145:3000",
    "http://192.168.6.1:3000",
    "http://100.105.177.100:3000",
]


def CORS_func(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        # allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
