import os
import pypdf
import re

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"
reader = pypdf.PdfReader(pdf_path)

# Extract and merge text
full_text_lines = []
for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    if text:
        # Keep track of which page each line came from
        for line in text.split('\n'):
            full_text_lines.append((idx + 1, line.strip()))

# Let's search for hymn patterns and write them to a report
output_path = "debug_report.txt"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(f"PDF Analysis Report: {pdf_path}\n")
    f.write(f"Total pages: {len(reader.pages)}\n")
    f.write(f"Total lines: {len(full_text_lines)}\n\n")
    
    current_hymn = None
    hymns_found = []
    
    # Let's inspect potential headers
    for page_num, line in full_text_lines:
        if not line:
            continue
        
        # Check if line matches a hymn header (e.g. "123 Title")
        # Ensure that it doesn't look like a Bible reading or verse index (like "1 Cor.", "2 Tes.")
        # and doesn't look like a stanza number (like "1. ", which has a dot)
        match = re.match(r"^(\d+)\s+([A-ZÁÉÍÓÚÑ¡¿].*)$", line)
        if match:
            num_str, title = match.groups()
            num = int(num_str)
            
            # Filter out bible references or categories
            # Let's print all of them to let us analyze
            is_bible = any(word in title for word in ["Cor.", "Tes.", "Pedro", "Juan", "Rom.", "Apoc.", "Gál.", "Efes.", "Fil.", "Col.", "Heb.", "Sant.", "Luc.", "Mar.", "Mat.", "Hech."])
            is_category = title.isupper() and len(title) > 3
            
            note = ""
            if is_bible:
                note = " [BIBLE REF]"
            elif is_category:
                note = " [CATEGORY?]"
                
            f.write(f"Page {page_num:3d} | Line: {line:<40} | Num: {num:<3} | Title: {title}{note}\n")

print(f"Debug report written to {output_path}")
