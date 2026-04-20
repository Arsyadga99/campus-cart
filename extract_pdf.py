import pypdf

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = pypdf.PdfReader(file)
        text = ''
        for i, page in enumerate(reader.pages):
            text += f'\n\n--- Page {i + 1} ---\n\n'
            text += page.extract_text()
        return text

if __name__ == '__main__':
    text = extract_text('ECommerce.pdf')
    with open('ECommerce_Extracted.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Extraction complete. Saved to ECommerce_Extracted.txt')
