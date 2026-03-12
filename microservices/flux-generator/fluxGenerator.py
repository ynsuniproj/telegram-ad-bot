from diffusers import FluxPipeline
import torch
import base64
from io import BytesIO
import os

# Lazily load the pipeline to avoid crashing the server on boot if models are missing
pipe = None

def get_pipeline():
    global pipe
    if pipe is None:
        print("Loading FLUX.1-schnell model into memory...")
        model_path = os.environ.get("FLUX_MODEL_PATH", "black-forest-labs/FLUX.1-schnell")
        
        # Load the pipeline
        pipe = FluxPipeline.from_pretrained(
            model_path, 
            torch_dtype=torch.bfloat16
        )
        
        # Move to GPU if available 
        if torch.cuda.is_available():
            pipe = pipe.to("cuda")
            print("Model loaded onto GPU.")
        else:
            print("WARNING: CUDA not available. Running on CPU will be extremely slow.")
            
    return pipe

def generate_image(prompt: str, width: int = 1024, height: int = 1024) -> str:
    print(f"Generating image. Prompt: {prompt}")
    
    pipeline = get_pipeline()
    
    # Generate image (schnell requires fewer steps, default is 4)
    image = pipeline(
        prompt,
        height=height,
        width=width,
        guidance_scale=0.0,
        num_inference_steps=4,
        max_sequence_length=256
    ).images[0]
    
    # Convert PIL Image to Base64 String
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return img_str
