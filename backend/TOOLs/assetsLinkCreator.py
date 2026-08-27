from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os


# This will create following endpoint: "/images/products/example.jpg"
# It won't be seen in OpenAPI docs interface tho.
def create_asset_links(app: FastAPI):
    # Create the folder if it doesn't exist
    os.makedirs("uploads/products", exist_ok=True)

    # Mount the directory to a URL route
    app.mount("/images", StaticFiles(directory="uploads"), name="images")
