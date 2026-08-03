import os
import pypdf
import re
import json

pdf_path = r"C:\Users\Gerson Pino\Downloads\Himn-Vid-Crist (2).pdf"
output_json_path = "himnos.json"

def get_hymn_category(num):
    """
    Returns the category of a hymn based on standard Himnos de la Vida Cristiana groupings.
    """
    if 1 <= num <= 14:
        return "Adoración y Alabanza - La Trinidad"
    elif 15 <= num <= 56:
        return "Jesucristo - Su Nacimiento y Vida"
    elif 57 <= num <= 65:
        return "Jesucristo - Su Resurrección y Ascensión"
    elif 66 <= num <= 71:
        return "Jesucristo - Alabanza y Adoración"
    elif 72 <= num <= 83:
        return "Jesucristo - Su Segunda Venida"
    elif 84 <= num <= 93:
        return "El Espíritu Santo"
    elif 94 <= num <= 119:
        return "Vida Cristiana - Invitación, Arrepentimiento y Fe"
    elif 120 <= num <= 130:
        return "Vida Cristiana - Oración y Devoción"
    elif 131 <= num <= 146:
        return "Vida Cristiana - Consagración y Santidad"
    elif 147 <= num <= 190:
        return "Vida Cristiana - Confianza, Paz y Seguridad"
    elif 191 <= num <= 206:
        return "Vida Cristiana - Conflicto y Victoria"
    elif 207 <= num <= 219:
        return "Vida Cristiana - Vida Futura y Hogar Celestial"
    elif 220 <= num <= 225:
        return "La Iglesia"
    elif 226 <= num <= 230:
        return "Las Sagradas Escrituras"
    elif 231 <= num <= 233:
        return "El Día del Señor"
    elif 234 <= num <= 238:
        return "Bautismo"
    elif 239 <= num <= 242:
        return "Santa Cena"
    elif 243 <= num <= 262:
        return "Misiones y Evangelización"
    elif 263 <= num <= 304:
        return "Testimonio y Salvación"
    elif 305 <= num <= 310:
        return "Avivamiento"
    elif 311 <= num <= 325:
        return "Invitación"
    elif 326 <= num <= 332:
        return "Niños"
    elif 333 <= num <= 337:
        return "Jóvenes"
    elif 338 <= num <= 339:
        return "Despedida y Bendición"
    elif 340 <= num <= 340:
        return "Mujeres"
    elif 341 <= num <= 344:
        return "Acción de Gracias / Mayordomía"
    elif 345 <= num <= 347:
        return "Hogar y Matrimonio"
    elif 348 <= num <= 348:
        return "A la Madre"
    elif 349 <= num <= 350:
        return "Clausura y Misiones"
    return "Varios"

def parse_pdf():
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        return

    print("Opening PDF...")
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")

    print("Extracting text and combining lines...")
    raw_lines = []
    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        if page_num >= 224:
            break
        text = page.extract_text()
        if text:
            # Split by lines and clean
            for line in text.split('\n'):
                line_clean = line.strip()
                if line_clean:
                    raw_lines.append((page_num, line_clean))

    print(f"Total lines extracted: {len(raw_lines)}")

    items = []
    current_item = None
    expected_num = 1

    for page_num, line in raw_lines:
        # Check for headers: starts with digits, followed by space and uppercase/accented letter/punctuation
        match = re.match(r"^(\d+)\s+([A-ZÁÉÍÓÚÑ¡¿].*)$", line)
        if match:
            num = int(match.group(1))
            title = match.group(2).strip()
            
            # Use strict sequential numbering check to distinguish hymn headers from Bible references
            if num == expected_num:
                if current_item:
                    items.append(current_item)
                
                # Determine section and category
                if num <= 350:
                    seccion = "himno"
                    categoria = get_hymn_category(num)
                else:
                    seccion = "lectura"
                    # For scripture readings, the title itself is the category
                    # e.g., "351 ALABANZA" -> category is "ALABANZA"
                    categoria = title
                
                current_item = {
                    "numero": num,
                    "titulo": title,
                    "seccion": seccion,
                    "categoria": categoria,
                    "paginas_pdf": [page_num],
                    "lineas_crudas": []
                }
                expected_num += 1
                continue
        
        # If we have an active item, add line to its raw lines
        if current_item:
            current_item["lineas_crudas"].append(line)
            # Log pages spanned
            if page_num not in current_item["paginas_pdf"]:
                current_item["paginas_pdf"].append(page_num)

    # Add the last item
    if current_item:
        items.append(current_item)

    print(f"Hymns and readings parsed: {len(items)}")

    # Process raw lines of each item into structured letra
    structured_items = []
    for item in items:
        num = item["numero"]
        title = item["titulo"]
        seccion = item["seccion"]
        categoria = item["categoria"]
        
        raw_lines = item["lineas_crudas"]
        letra_estructurada = []
        
        if seccion == "himno":
            # State machine for grouping lines into stanzas and choruses
            current_section = None
            
            for line in raw_lines:
                # Remove running page header noise or stray page markers if any
                if re.match(r"^Himnos de la Vida Cristiana", line, re.IGNORECASE):
                    continue
                
                # Check for stanza start: e.g. "1. ", "2. ", "10. "
                stanza_match = re.match(r"^(\d+)\.\s*(.*)$", line)
                if stanza_match:
                    if current_section:
                        letra_estructurada.append(current_section)
                    stanza_num = int(stanza_match.group(1))
                    first_line = stanza_match.group(2).strip()
                    current_section = {
                        "tipo": "estrofa",
                        "numero": stanza_num,
                        "lineas": [first_line] if first_line else []
                    }
                    continue
                
                # Check for chorus start: e.g. "CORO", "CORO:", "ULTIMO CORO", "Coro"
                chorus_match = re.match(r"^(CORO|ULTIMO CORO|Coro)\s*:?\s*(.*)$", line)
                if chorus_match:
                    if current_section:
                        letra_estructurada.append(current_section)
                    chorus_tag = chorus_match.group(1).upper()
                    first_line = chorus_match.group(2).strip()
                    current_section = {
                        "tipo": "coro",
                        "etiqueta": chorus_tag,
                        "lineas": [first_line] if first_line else []
                    }
                    continue
                
                # If it's a regular line
                if current_section is None:
                    # Create an initial default stanza if text starts without a number
                    current_section = {
                        "tipo": "estrofa",
                        "numero": 1 if len(letra_estructurada) == 0 else None,
                        "lineas": [line]
                    }
                else:
                    current_section["lineas"].append(line)
            
            if current_section:
                letra_estructurada.append(current_section)
                
        else:
            # For scripture readings, group all text by paragraphs
            # Bible references and alternating text paragraphs
            current_section = {
                "tipo": "lectura",
                "lineas": []
            }
            for line in raw_lines:
                # Clean up lines and just accumulate them
                if line:
                    current_section["lineas"].append(line)
            letra_estructurada.append(current_section)

        # Clean empty sections or lines
        cleaned_letra = []
        for sect in letra_estructurada:
            # Strip lines and filter empty ones
            sect["lineas"] = [line.strip() for line in sect["lineas"] if line.strip()]
            if sect["lineas"]:
                cleaned_letra.append(sect)

        structured_items.append({
            "numero": num,
            "titulo": title,
            "seccion": seccion,
            "categoria": categoria,
            "paginas_pdf": item["paginas_pdf"],
            "letra": cleaned_letra
        })

    print(f"Writing structured data to {output_json_path}...")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(structured_items, f, ensure_ascii=False, indent=2)

    print("Success! JSON file generated successfully.")

if __name__ == "__main__":
    parse_pdf()
