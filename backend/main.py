
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services.dna_service import analyze_dna


app = FastAPI(
    title="BioLab Scientific API",
    description="Bioinformatics API powered by Python and Biopython",
    version="1.0.0"
)


# Frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://biolab-platform-1fli.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class DNARequest(BaseModel):
    sequence: str = Field(
        ...,
        min_length=1,
        max_length=100000
    )


@app.get("/")
def home():
    return {
        "status": "online",
        "project": "BioLab",
        "engine": "Python + Biopython",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "BioLab API"
    }


@app.post("/api/dna/analyze")
def dna_analysis(data: DNARequest):
    try:
        result = analyze_dna(data.sequence)
        return result

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error)
        )
        
