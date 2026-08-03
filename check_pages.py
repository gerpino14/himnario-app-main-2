import os
import pypdf

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"
reader = pypdf.PdfReader(pdf_path)

# Let's inspect pages 215 to 230 (0-indexed: 214 to 229)
for idx in range(214, 230):
    if idx < len(reader.pages):
        print(f"\n--- PAGE {idx + 1} ---")
        text = reader.pages[idx].extract_text()
        print(text[:1200])
