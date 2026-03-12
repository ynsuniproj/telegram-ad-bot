from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from fluxGenerator import generate_image
import os

app = FastAPI(title="FLUX Image Generator API")

class PromptRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024

@app.post("/generate")
def generate(request: PromptRequest):
    try:
        # Calls the internal model loader
        base64_img = generate_image(request.prompt, request.width, request.height)
        return {"success": True, "image": base64_img}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Remove hardcoded 0.0.0.0 and port inside uvicorn to allow command line args
    # or keep it dynamic depending on the environment.
    uvicorn.run("main:app", host="0.0.0.0", port=port)
