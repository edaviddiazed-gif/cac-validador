/**
 * Tests unitarios para el parser CAC.
 */

import { describe, it, expect } from "vitest";
import { validateFilename } from "../filename-validator";
import { detectForbiddenChars, sanitizeText } from "../character-validator";
import { parseCAC } from "../cac-parser";

// ============================================================
// Filename Validator
// ============================================================
describe("validateFilename", () => {
  it("acepta nombre válido", () => {
    const result = validateFilename("20230505_EPS001_CANCER.txt");
    expect(result.valid).toBe(true);
    expect(result.parsed?.fecha).toBe("2023-05-05");
    expect(result.parsed?.codigoEapb).toBe("EPS001");
  });

  it("acepta código EAPB largo", () => {
    const result = validateFilename("20230505_EPSXXXXXX_CANCER.txt");
    expect(result.valid).toBe(true);
  });

  it("rechaza nombre sin patrón correcto", () => {
    const result = validateFilename("reporte_cancer.txt");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Patrón esperado");
  });

  it("rechaza extensión incorrecta", () => {
    const result = validateFilename("20230505_EPS001_CANCER.csv");
    expect(result.valid).toBe(false);
  });

  it("rechaza fecha inválida", () => {
    const result = validateFilename("20231301_EPS001_CANCER.txt");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Fecha inválida");
  });
});

// ============================================================
// Character Validator
// ============================================================
describe("detectForbiddenChars", () => {
  it("no detecta errores en texto ASCII limpio", () => {
    const errors = detectForbiddenChars("JUAN CARLOS LOPEZ", 1);
    expect(errors).toHaveLength(0);
  });

  it("detecta ñ y tildes", () => {
    const errors = detectForbiddenChars("MUÑOZ LÓPEZ", 1);
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors[0].char).toBe("Ñ");
    expect(errors[0].replacement).toBe("N");
  });

  it("detecta & y #", () => {
    const errors = detectForbiddenChars("A & B # C", 1);
    expect(errors).toHaveLength(2);
  });

  it("reporta posición exacta", () => {
    const errors = detectForbiddenChars("ABCñDEF", 5);
    expect(errors[0].position).toBe(3);
    expect(errors[0].line).toBe(5);
    expect(errors[0].column).toBe(4);
  });
});

describe("sanitizeText", () => {
  it("reemplaza caracteres prohibidos", () => {
    expect(sanitizeText("MUÑOZ")).toBe("MUNOZ");
    expect(sanitizeText("LÓPEZ")).toBe("LOPEZ");
    expect(sanitizeText("A & B")).toBe("A Y B");
  });

  it("no modifica texto limpio", () => {
    expect(sanitizeText("JUAN CARLOS")).toBe("JUAN CARLOS");
  });
});

// ============================================================
// CAC Parser
// ============================================================
describe("parseCAC", () => {
  const makeRow = (fields: string[]) => {
    // Pad to 168 fields
    while (fields.length < 168) {
      fields.push("");
    }
    return fields.join("\t");
  };

  it("parsea un registro con 168 campos", () => {
    const fields = [
      "JUAN", "CARLOS", "PEREZ", "GOMEZ",
      "CC", "1234567890", "1970-05-15", "M",
      "9999", "C", "EPS001", "1", "1",
      "05001", "3001234567", "2020-01-01",
    ];
    const line = makeRow(fields);
    const result = parseCAC(line, "20230505_EPS001_CANCER.txt");

    expect(result.records).toHaveLength(1);
    expect(result.records[0].record.v01_primer_nombre).toBe("JUAN");
    expect(result.records[0].record.v06_numero_id).toBe("1234567890");
    expect(result.records[0].record.v08_sexo).toBe("M");
  });

  it("reporta error si tiene menos de 168 campos", () => {
    const line = "JUAN\tCARLOS\tPEREZ";
    const result = parseCAC(line, "20230505_EPS001_CANCER.txt");
    expect(result.errors.some((e) => e.type === "field_count")).toBe(true);
  });

  it("detecta caracteres prohibidos en el contenido", () => {
    const fields = ["MUÑOZ", "", "LÓPEZ", ""];
    const line = makeRow(fields);
    const result = parseCAC(line, "20230505_EPS001_CANCER.txt");
    expect(result.errors.some((e) => e.type === "character")).toBe(true);
  });

  it("parsea múltiples líneas", () => {
    const line1 = makeRow(["JUAN", "", "PEREZ", ""]);
    const line2 = makeRow(["MARIA", "", "GOMEZ", ""]);
    const content = line1 + "\n" + line2;
    const result = parseCAC(content, "20230505_EPS001_CANCER.txt");
    expect(result.records).toHaveLength(2);
    expect(result.totalLines).toBe(2);
  });

  it("valida el nombre del archivo", () => {
    const line = makeRow(["JUAN"]);
    const result = parseCAC(line, "invalid.txt");
    expect(result.filename.valid).toBe(false);
  });
});
