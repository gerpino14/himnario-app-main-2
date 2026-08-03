import os
import pypdf

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"
reader = pypdf.PdfReader(pdf_path)

for i in range(5, 15):
    print(f"\n--- PAGE {i+1} ---")
    page_text = reader.pages[i].extract_text()
    print(page_text[:1500])
