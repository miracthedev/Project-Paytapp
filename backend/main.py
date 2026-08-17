from fastapi import FastAPI
from backend.auth.cors import CORS_func
from sql import start_db, get_session, create_dummy_data

app = FastAPI()

CORS_func(app)

global_engine = start_db()

create_dummy_data(global_engine)


@app.get("/")
def read_root():
    return {"message": "Paytapp backend is up and running!"}