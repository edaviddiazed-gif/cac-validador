-- ============================================================
-- CAC Validador v2.0 — Seed de Catálogos y Datos Base
-- ============================================================

-- ========================
-- 1. CIE-10 CAC (Muestra)
-- ========================
INSERT INTO cie10_cac (codigo, descripcion, agrupador, activo) VALUES
('C00', 'Tumor maligno del labio', 'Labio', true),
('C01', 'Tumor maligno de la base de la lengua', 'Lengua', true),
('C02', 'Tumor maligno de otras partes de la lengua', 'Lengua', true),
('C50', 'Tumor maligno de la mama', 'Mama', true),
('C50.9', 'Tumor maligno de la mama, parte no especificada', 'Mama', true),
('C61', 'Tumor maligno de la próstata', 'Próstata', true),
('C34', 'Tumor maligno de los bronquios y del pulmón', 'Pulmón', true),
('C25', 'Tumor maligno del páncreas', 'Páncreas', true),
('C15', 'Tumor maligno del esófago', 'Esófago', true),
('C16', 'Tumor maligno del estómago', 'Estómago', true),
('C18', 'Tumor maligno del colon', 'Colon', true),
('C19', 'Tumor maligno de la unión rectosigmoidea', 'Recto', true),
('C20', 'Tumor maligno del recto', 'Recto', true),
('C22', 'Tumor maligno del hígado y conductos biliares intrahepáticos', 'Hígado', true),
('C23', 'Tumor maligno de la vesícula biliar', 'Vesícula', true),
('C32', 'Tumor maligno de la laringe', 'Laringe', true),
('C41', 'Tumor maligno del hueso y cartílago articular', 'Hueso', true),
('C43', 'Melanoma maligno de la piel', 'Piel', true),
('C53', 'Tumor maligno del cuello del útero', 'Cuello útero', true),
('C54', 'Tumor maligno del cuerpo del útero', 'Útero', true),
('C56', 'Tumor maligno del ovario', 'Ovario', true),
('C73', 'Tumor maligno de la glándula tiroides', 'Tiroides', true),
('C81', 'Linfoma de Hodgkin', 'Linfoma', true),
('C82', 'Linfoma folicular (nodular)', 'Linfoma', true),
('C83', 'Linfoma difuso de células grandes', 'Linfoma', true),
('C90', 'Mieloma múltiple y tumores malignos de células plasmáticas', 'Mieloma', true),
('C92', 'Leucemia mieloide', 'Leucemia', true),
('C95', 'Leucemia de tipo no especificado', 'Leucemia', true),
('D00', 'Carcinoma in situ del tracto digestivo', 'Lesiones premalignas', true),
('D05', 'Carcinoma in situ de la mama', 'Lesiones premalignas', true);

-- ========================
-- 2. ATC Medicamentos (Muestra Antineoplásicos)
-- ========================
INSERT INTO atc_medicamentos (codigo, nombre, categoria, activo) VALUES
('L01AA01', 'Ciclofosfamida', 'Alquilantes', true),
('L01AA02', 'Ifosfamida', 'Alquilantes', true),
('L01AB01', 'Busulfán', 'Alquilantes', true),
('L01BB02', 'Daunorubicina', 'Antibióticos antitumor', true),
('L01BB03', 'Doxorubicina', 'Antibióticos antitumor', true),
('L01BB05', 'Idarrubicina', 'Antibióticos antitumor', true),
('L01BC01', 'Bleomicina', 'Antibióticos antitumor', true),
('L01CD01', 'Etoposido', 'Inhibidores topoisomerasa', true),
('L01CD02', 'Tenipósido', 'Inhibidores topoisomerasa', true),
('L01DB01', 'Docetaxel', 'Taxanos', true),
('L01DB02', 'Paclitaxel', 'Taxanos', true),
('L01DB03', 'Cabazitaxel', 'Taxanos', true),
('L01DC01', 'Vinblastina', 'Alcaloides Vinca', true),
('L01DC02', 'Vincristina', 'Alcaloides Vinca', true),
('L01DC03', 'Vindesina', 'Alcaloides Vinca', true),
('L01DC04', 'Vinorelbina', 'Alcaloides Vinca', true),
('L01EA01', 'Fluorouracilo (5-FU)', 'Antimetabolitos', true),
('L01EA03', 'Tegafur', 'Antimetabolitos', true),
('L01EA04', 'Capecitabina', 'Antimetabolitos', true),
('L01EB01', 'Metotrexato', 'Antimetabolitos', true),
('L01EB02', 'Raltitrexed', 'Antimetabolitos', true),
('L01EC03', 'Citarabina', 'Antimetabolitos', true),
('L01EX01', 'Hidroxiurea', 'Antimetabolitos', true),
('L01GA01', 'Tretinoin', 'Retinoides', true),
('L01XA01', 'Bortezomib', 'Inhibidores proteosoma', true),
('L01XB01', 'Imatinib', 'Inhibidores tirosina-cinasa', true),
('L01XB02', 'Gefitinib', 'Inhibidores tirosina-cinasa', true),
('L01XB03', 'Erlotinib', 'Inhibidores tirosina-cinasa', true),
('L01XB04', 'Sunitinib', 'Inhibidores tirosina-cinasa', true),
('L01XB05', 'Sorafenib', 'Inhibidores tirosina-cinasa', true),
('L01XC02', 'Bevacizumab', 'Inhibidores angiogénesis', true),
('L01XD01', 'Rituximab', 'Anticuerpos monoclonales', true),
('L01XD02', 'Trastuzumab', 'Anticuerpos monoclonales', true),
('L01XD03', 'Cetuximab', 'Anticuerpos monoclonales', true),
('L01XD04', 'Pembrolizumab', 'Anticuerpos monoclonales', true),
('L01XD05', 'Nivolumab', 'Anticuerpos monoclonales', true);

-- ========================
-- 3. CUPS Procedimientos (Muestra)
-- ========================
INSERT INTO cups_procedimientos (codigo, descripcion, tipo, activo) VALUES
('80101', 'Mastectomía simple unilateral', 'Cirugía', true),
('80102', 'Mastectomía simple bilateral', 'Cirugía', true),
('80103', 'Mastectomía radical modificada unilateral', 'Cirugía', true),
('80104', 'Mastectomía radical modificada bilateral', 'Cirugía', true),
('80105', 'Cuadrantectomía o resección segmentaria de mama', 'Cirugía', true),
('80110', 'Biopsia de mama', 'Cirugía', true),
('84300', 'Prostatectomía radical retropúbica', 'Cirugía', true),
('84301', 'Prostatectomía radical perineal', 'Cirugía', true),
('84302', 'Prostatectomía radical laparoscópica', 'Cirugía', true),
('84400', 'Histerectomía total abdominal', 'Cirugía', true),
('84401', 'Histerectomía total vaginal', 'Cirugía', true),
('84402', 'Histerectomía radical', 'Cirugía', true),
('86000', 'Ovariosalpingectomía bilateral', 'Cirugía', true),
('86001', 'Ovariosalpingectomía unilateral', 'Cirugía', true),
('76040', 'Neumonectomía', 'Cirugía', true),
('76041', 'Lobectomía pulmonar', 'Cirugía', true),
('76042', 'Segmentectomía pulmonar', 'Cirugía', true),
('75390', 'Gastrectomía total', 'Cirugía', true),
('75391', 'Gastrectomía subtotal', 'Cirugía', true),
('91080', 'Colectomía derecha', 'Cirugía', true),
('91081', 'Colectomía izquierda', 'Cirugía', true),
('91082', 'Colectomía total', 'Cirugía', true),
('91090', 'Resección anterior del recto', 'Cirugía', true),
('91091', 'Resección abdominoperineal', 'Cirugía', true),
('91540', 'Hepatectomía parcial', 'Cirugía', true),
('91780', 'Pancreatectomía', 'Cirugía', true),
('76041', 'Broncoscopia diagnóstica', 'Diagnóstico', true),
('91201', 'Colonoscopia diagnóstica', 'Diagnóstico', true),
('91202', 'Endoscopia digestiva superior', 'Diagnóstico', true),
('97020', 'Radioterapia externa', 'Radioterapia', true),
('97030', 'Braquiterapia', 'Radioterapia', true),
('97010', 'Consulta oncología', 'Consulta', true);

-- ========================
-- 4. DIVIPOLA Municipios (Muestra por Departamento)
-- ========================

-- Bogotá D.C.
INSERT INTO divipola_municipios (codigo, nombre, departamento, codigo_departamento) VALUES
('11001', 'Bogotá D.C.', 'Bogotá D.C.', '11'),
('05001', 'Medellín', 'Antioquia', '05'),
('05045', 'Itagüí', 'Antioquia', '05'),
('05079', 'Envigado', 'Antioquia', '05'),
('05089', 'Sabaneta', 'Antioquia', '05'),
('05360', 'Turbo', 'Antioquia', '05'),
('08001', 'Barranquilla', 'Atlántico', '08'),
('08078', 'Soledad', 'Atlántico', '08'),
('08141', 'Malambo', 'Atlántico', '08'),
('13001', 'Cartagena', 'Bolívar', '13'),
('13011', 'Turbaco', 'Bolívar', '13'),
('15001', 'Bogotá D.C.', 'Cundinamarca', '15'),  
('15307', 'Soacha', 'Cundinamarca', '15'),
('15748', 'Zipaquirá', 'Cundinamarca', '15'),
('17001', 'Valledupar', 'Cesar', '17'),
('18001', 'Quibdó', 'Chocó', '18'),
('19001', 'Santa Marta', 'Magdalena', '19'),
('23001', 'Cali', 'Valle del Cauca', '23'),
('23141', 'Palmira', 'Valle del Cauca', '23'),
('23217', 'Buenaventura', 'Valle del Cauca', '23'),
('27001', 'Necoclí', 'Córdoba', '27'),
('47001', 'Pereira', 'Risaralda', '47'),
('47351', 'Dosquebradas', 'Risaralda', '47'),
('52001', 'Bucaramanga', 'Santander', '52'),
('52644', 'Giron', 'Santander', '52'),
('54001', 'Sincelejo', 'Sucre', '54'),
('76001', 'Cúcuta', 'Norte de Santander', '76'),
('73001', 'Ibagué', 'Tolima', '73'),
('76521', 'Ocaña', 'Norte de Santander', '76'),
('44001', 'Pasto', 'Nariño', '44');

-- ========================
-- 5. EAPB Base
-- ========================
INSERT INTO eapb (codigo, nombre, regimen, nit, activo) VALUES
('0001', 'EAPB Test', 'C', '860502812-9', true),
('0002', 'EPS Servicios', 'C', '860502813-8', true),
('0003', 'Salud Integral', 'S', '860502814-7', true),
('0004', 'Medicina Prepagada', 'E', '860502815-6', true),
('0005', 'Régimen Especial', 'P', '860502816-5', true);

-- ========================
-- Mensajes de Validación
-- ========================
INSERT INTO validacion_mensajes (tipo, codigo, mensaje_es, severidad) VALUES
('COMODIN', 'COMODIN_DESCONOCIDO', 'Fecha desconocido (1800-01-01) - puede indicar dato faltante', 'WARNING'),
('COMODIN', 'COMODIN_NO_APLICA', 'Fecha no aplica (1845-01-01) - variable no relevante para este caso', 'INFO'),
('COMODIN', 'COMODIN_ENTE_TERRITORIAL', 'Fecha ente territorial (1846-01-01) - reportado por autoridad territorial', 'INFO'),
('VALIDACION', 'FORMATO_FECHA_INVALIDA', 'Formato de fecha inválido. Esperado: YYYY-MM-DD', 'ERROR'),
('VALIDACION', 'RANGO_EDAD_INVALIDO', 'Edad fuera de rango válido (0-120 años)', 'ERROR'),
('VALIDACION', 'CIE10_NO_ENCONTRADO', 'Código CIE-10 no encontrado en catálogo CAC', 'ERROR'),
('VALIDACION', 'CUPS_NO_ENCONTRADO', 'Código CUPS no encontrado en catálogo', 'ERROR'),
('VALIDACION', 'ATC_NO_ENCONTRADO', 'Código ATC de medicamento no encontrado', 'ERROR'),
('VALIDACION', 'MUNICIPIO_NO_ENCONTRADO', 'Código DIVIPOLA de municipio no encontrado', 'ERROR'),
('CRUCE', 'V128_V131_REQUERIDO', 'V128=4 (Fallecido) requiere V131 (Fecha de muerte)', 'ERROR'),
('CRUCE', 'V128_V132_REQUERIDO', 'V128=4 (Fallecido) requiere V132 (Causa de muerte)', 'ERROR'),
('CRUCE', 'V18_V24_INCONSISTENCIA', 'V18 (Fecha diagnóstico) debe coincidir con V24 (Fecha biopsia) cuando aplicable', 'WARNING'),
('CRUCE', 'V126_V131_REQUERIDO', 'V126=2 (Fallecido) requiere V131 (Fecha muerte)', 'ERROR'),
('NEGOCIO', 'FECHA_FUTURA', 'La fecha no puede ser en el futuro', 'ERROR'),
('NEGOCIO', 'NOVEDAD_INCONSISTENTE', 'Novedad administrativa inconsistente con estado vital', 'ERROR');
