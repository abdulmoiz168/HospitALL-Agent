import { ReportInput, ReportValue } from "../schemas/report";

const LINE_REGEX =
  /^([A-Za-z0-9\s\-/]+)[:\s]+([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z/%]+)?\s*(?:\(([-0-9.]+)\s*-\s*([-0-9.]+)\))?/i;

const parseRawText = (rawText: string): ReportValue[] => {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const values: ReportValue[] = [];

  for (const line of lines) {
    const match = LINE_REGEX.exec(line);
    if (!match) continue;

    const [, name, value, unit, low, high] = match;
    values.push({
      name: name.trim(),
      value: Number(value),
      unit: unit?.trim(),
      referenceRange: low || high ? { low: Number(low), high: Number(high) } : undefined,
    });
  }

  return values;
};

export const parseReportValues = (input: ReportInput) => {
  if (input.values && input.values.length > 0) {
    return input.values;
  }

  if (input.rawText) {
    return parseRawText(input.rawText);
  }

  return [];
};

export const analyzeReportValues = (values: ReportValue[]) => {
  const abnormalValues: Array<{
    name: string;
    value: number;
    unit?: string;
    interpretation: string;
  }> = [];
  const uncertainty: string[] = [];

  for (const value of values) {
    const range = value.referenceRange;
    if (!range?.low && !range?.high) {
      uncertainty.push(
        `${value.name}: reference range missing; interpretation may be limited.`,
      );
      continue;
    }

    if (range.low !== undefined && value.value < range.low) {
      abnormalValues.push({
        name: value.name,
        value: value.value,
        unit: value.unit,
        interpretation: "Below the reference range.",
      });
      continue;
    }

    if (range.high !== undefined && value.value > range.high) {
      abnormalValues.push({
        name: value.name,
        value: value.value,
        unit: value.unit,
        interpretation: "Above the reference range.",
      });
      continue;
    }
  }

  return { abnormalValues, uncertainty };
};
