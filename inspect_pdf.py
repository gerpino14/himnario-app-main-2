import os
import pypdf

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"

if not os.path.exists(pdf_path):
    print("PDF not found at:", pdf_path)
    exit(1)

reader = pypdf.PdfReader(pdf_path)
print(f"Total pages: {len(reader.pages)}")

# Print text from the first 5 pages to inspect the format
for i in range(min(5, len(reader.pages))):
    print(f"\n--- PAGE {i+1} ---")
    page_text = reader.pages[i].extract_text()
    print(page_text[:1000])  # Show up to 1000 characters
