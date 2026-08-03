import os
import pypdf
import re

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"
reader = pypdf.PdfReader(pdf_path)

# Extract text page by page and concatenate
full_text = []
for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    if text:
        full_text.append((idx + 1, text))

print(f"Extracted text from {len(full_text)} pages.")

# Look for hymn headers: lines starting with a number
# Let's see how many matches we find
hymn_headers = []
for page_num, text in full_text:
    lines = text.split('\n')
    for line in lines:
        line_clean = line.strip()
        # Regex: starts with 1-3 digits, followed by space, followed by uppercase letter or upside down exclamation
        match = re.match(r"^(\d+)\s+([A-ZÁÉÍÓÚÑ¡¿].*)$", line_clean)
        if match:
            hymn_headers.append((page_num, match.group(1), match.group(2)))

print(f"Found {len(hymn_headers)} potential hymn headers.")
# Print the first 20 and last 10 headers found
print("First 20 headers:")
for h in hymn_headers[:20]:
    print(f"Page {h[0]}: Hymn {h[1]} - {h[2]}")

print("\nLast 10 headers:")
for h in hymn_headers[-10:]:
    print(f"Page {h[0]}: Hymn {h[1]} - {h[2]}")
