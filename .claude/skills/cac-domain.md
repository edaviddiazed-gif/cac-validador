---
name: cac-domain
description: Glosario completo del dominio CAC — Resolución 0247/2014
---

# Skill: Dominio CAC — Glosario y Reglas de Negocio

## Entidades del Ecosistema

### CAC — Cuenta de Alto Costo
Organismo técnico del SGSSS colombiano que centraliza la información de enfermedades de alto costo (cáncer, VIH, ERC, etc.). Recibe reportes periódicos de las EAPB.

### EAPB — Entidad Administradora de Planes de Beneficios
Genéricamente conocidas como "EPS". Incluye EPS contributivas, subsidiadas, regímenes especiales y de excepción. Son las que deben reportar datos de pacientes con cáncer.

### SGSSS — Sistema General de Seguridad Social en Salud
Marco regulatorio de salud en Colombia. Ley 100/1993 y modificaciones.

### SISCAC — Sistema de Información de la Cuenta de Alto Costo
Aplicativo web de la CAC donde las EAPB cargan sus archivos de reporte. Acepta archivos TXT ANSI con formato específico.

### IPS — Institución Prestadora de Servicios de Salud
Hospitales, clínicas y centros donde se presta la atención. Identificadas por código de habilitación.

---

## Marco Legal

### Resolución 0247/2014
Norma del MinSalud que establece la obligatoriedad del reporte de datos de cáncer por parte de las EAPB a la CAC. Define las 134 variables obligatorias.

### Ley 1581/2012 — Habeas Data
Ley de protección de datos personales en Colombia. Aplica a todos los datos de salud de los pacientes.

### Período de Medición
Corte al 01 de enero de cada año. Fecha límite de reporte: 5 de mayo.

---

## Catálogos de Referencia

### CIE-10 — Clasificación Internacional de Enfermedades
Versión "operativa CAC": subconjunto de CIE-10 relevante para cáncer. Incluye códigos C00-C97 (neoplasias malignas) y D00-D09 (in situ).

### ATC — Anatomical Therapeutic Chemical Classification
Sistema de codificación de medicamentos de la OMS. Se usa para reportar quimioterapia, hormonoterapia e inmunoterapia. Grupo L (antineoplásicos).

### CUPS — Clasificación Única de Procedimientos en Salud
Catálogo colombiano de procedimientos médicos. Se usa para reportar cirugías y otros procedimientos.

### DIVIPOLA — División Político-Administrativa
Códigos del DANE para departamentos y municipios de Colombia. 5 dígitos: 2 departamento + 3 municipio.

### CIUO — Clasificación Internacional Uniforme de Ocupaciones
Códigos para la ocupación del paciente.

---

## Comodines de Fecha

Valores especiales que sustituyen fechas cuando el dato real no está disponible:

| Comodín | Significado | Uso típico |
|---------|-------------|------------|
| `1800-01-01` | **Desconocido** | No se tiene el dato, pero debería existir |
| `1845-01-01` | **No Aplica** | La variable no aplica al caso clínico |
| `1846-01-01` | **Ente territorial** | Dato reportado por ente territorial, no por EAPB |

**⚠ El motor de validación DEBE diferenciar estos comodines** según el contexto de cada variable. No es lo mismo "no aplica" que "desconocido".

---

## Tipos de Novedad Administrativa (V128)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| 1 | Caso activo | Paciente en seguimiento activo |
| 2 | Caso nuevo | Primer reporte del paciente a esta EAPB |
| 3 | Traslado recibido | Paciente llega trasladado de otra EAPB |
| 4 | Fallecido | Paciente falleció en el período |
| 5 | Traslado enviado | Paciente trasladado a otra EAPB |
| 6 | Desafiliado | Paciente ya no pertenece a la EAPB |
| 12 | Caso bilateral | Cáncer bilateral (ej: mama bilateral) |
| 16 | Caso reactivado | Paciente previamente reportado que reaparece |

**V128 es la variable más crítica** porque determina qué otras variables son obligatorias, opcionales o deben tener comodín.

---

## Estadificación Oncológica

### TNM (Tumores sólidos)
- **T**: Tamaño del tumor primario (T0-T4)
- **N**: Compromiso ganglionar (N0-N3)
- **M**: Metástasis a distancia (M0-M1)

### FIGO (Ginecológicos)
Sistema de estadificación para cánceres ginecológicos (cérvix, útero, ovario).

### Ann Arbor (Linfomas)
Estadificación para linfoma Hodgkin y no Hodgkin (I-IV, A/B).

### Gleason (Próstata)
Score de agresividad: suma de 2 patrones (2-10). Solo aplica cuando V17=C61.

### ECOG Performance Status
0=Asintomático, 1=Sintomático ambulatorio, 2=En cama <50% del tiempo, 3=En cama >50%, 4=Postrado, 5=Fallecido.

---

## Tipos de Documento (V05)

| Código | Tipo |
|--------|------|
| RC | Registro Civil |
| TI | Tarjeta de Identidad |
| CC | Cédula de Ciudadanía |
| CE | Cédula de Extranjería |
| PA | Pasaporte |
| MS | Menor sin identificar |
| AS | Adulto sin identificar |
| CD | Carné Diplomático |
| SC | Salvoconducto SC |
| PE | Permiso Especial de Permanencia |

---

## Régimen de Afiliación (V10)

| Código | Régimen |
|--------|---------|
| C | Contributivo |
| S | Subsidiado |
| P | Excepción (Fuerzas Militares, Ecopetrol, etc.) |
| E | Especial (Magisterio, universidades públicas) |
| N | No asegurado / Vinculado |

---

## Formato del Archivo de Reporte

- **Encoding**: ANSI (Windows-1252), NO UTF-8
- **Separador**: Tabulación (`\t`), NO coma ni punto y coma
- **Sin headers**: primera línea ya es un registro
- **1 línea = 1 paciente**: 168 campos por línea
- **Nombre archivo**: `{AAAAMMDD}_{CODEAPB}_CANCER.txt`
  - Ejemplo: `20230505_EPS001_CANCER.txt`
- **Caracteres prohibidos**: `& ñ á é í ó ú ü # ° ´`
