import os
import pypdf

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"
reader = pypdf.PdfReader(pdf_path)

with open("end_hymns.txt", "w", encoding="utf-8") as f:
    for page_idx in range(203, 208):  # Pages 204 to 208
        if page_idx < len(reader.pages):
            f.write(f"\n--- PAGE {page_idx + 1} ---\n")
            text = reader.pages[page_idx].extract_text()
            f.write(text if text else "[Empty Page]")
