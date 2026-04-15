import docx
doc = docx.Document('CAC_Plan_Maestro_Desarrollo_v2.docx')
with open('plan_maestro.txt', 'w', encoding='utf-8') as f:
    for p in doc.paragraphs:
        if p.text.strip():
            f.write(p.text.strip() + '\n')
