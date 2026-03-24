import pandas as pd
import pdfplumber

def parse_excel(file_path: str) -> list:
  df = pd.read_excel(file_path)
  df = df.fillna('')
  return df.to_dict(orient='records')

def parse_pdf(file_path: str) -> str:
  text = ''
  with pdfplumber.open(file_path) as pdf:
    for page in pdf.pages:
      text += page.extract_text() or ''
  return text
