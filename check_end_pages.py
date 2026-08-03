import pypdf

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"
reader = pypdf.PdfReader(pdf_path)

# Let's inspect page 223 (idx 222) and page 224 (idx 223)
for idx in [222, 223, 224]:
    print(f"\n--- PAGE {idx + 1} ---")
    text = reader.pages[idx].extract_text()
    print(text[:1000] if text else "[Empty]")
