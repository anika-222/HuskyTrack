from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import aiofiles
import PyPDF2
import io
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HuskyTrack API", version="1.0.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PDFUploadResponse(BaseModel):
    message: str
    filename: str
    file_size: int

class PDFContentResponse(BaseModel):
    filename: str
    content: str
    page_count: int

@app.get("/")
async def root():
    return {"message": "HuskyTrack API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is working"}

@app.post("/upload/pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process PDF files"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(upload_dir, file.filename)
        async with aiofiles.open(file_path, "wb") as buffer:
            content = await file.read()
            await buffer.write(content)
        
        return PDFUploadResponse(
            message="PDF uploaded successfully",
            filename=file.filename,
            file_size=len(content)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/pdfs")
async def list_pdfs():
    """List all uploaded PDFs"""
    try:
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            return {"pdfs": []}
        
        pdf_files = [f for f in os.listdir(upload_dir) if f.lower().endswith('.pdf')]
        return {"pdfs": pdf_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pdf/{filename}")
async def get_pdf(filename: str):
    """Get PDF file"""
    try:
        file_path = os.path.join("uploads", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PDF not found")
        
        return {"message": f"PDF {filename} found", "path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pdf/{filename}/content", response_model=PDFContentResponse)
async def get_pdf_content(filename: str):
    """Extract text content from PDF"""
    try:
        file_path = os.path.join("uploads", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PDF not found")
        
        # Read PDF and extract text
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text_content = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content += page.extract_text() + "\n"
        
        return PDFContentResponse(
            filename=filename,
            content=text_content.strip(),
            page_count=len(pdf_reader.pages)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)