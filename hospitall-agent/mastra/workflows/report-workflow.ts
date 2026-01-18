import { createStep, createWorkflow } from "@mastra/core/workflows";
import { analyzeReportValues, parseReportValues } from "../engines/report-engine";
import {
  ReportContextSchema,
  ReportInputSchema,
  ReportOutputSchema,
} from "../schemas/report";
import { selectCitations } from "../utils/citations";
import { verifyCitations } from "../utils/verifier";

const parseStep = createStep({
  id: "report-parse",
  inputSchema: ReportInputSchema,
  outputSchema: ReportContextSchema,
  execute: async ({ inputData }) => {
    const parsedValues = parseReportValues(inputData);
    return {
      ...inputData,
      parsedValues,
    };
  },
});

const analyzeStep = createStep({
  id: "report-analyze",
  inputSchema: ReportContextSchema,
  outputSchema: ReportContextSchema,
  execute: async ({ inputData }) => {
    const values = inputData.parsedValues ?? [];
    const { abnormalValues, uncertainty } = analyzeReportValues(values);
    return {
      ...inputData,
      abnormalValues,
      uncertainty,
    };
  },
});

const finalizeStep = createStep({
  id: "report-finalize",
  inputSchema: ReportContextSchema,
  outputSchema: ReportOutputSchema,
  execute: async ({ inputData }) => {
    const abnormalValues = inputData.abnormalValues ?? [];
    const uncertainty = inputData.uncertainty ?? [];
    const citations = selectCitations(["report", "reference"]);
    const verified = verifyCitations(citations, 1);

    const summary =
      abnormalValues.length > 0
        ? `Found ${abnormalValues.length} value(s) outside the reference range.`
        : "No values clearly outside the provided reference ranges.";

    const recommended_questions = abnormalValues.map(
      (value) => `What could explain ${value.name} being ${value.interpretation}`,
    );

    if (recommended_questions.length === 0) {
      recommended_questions.push(
        "Are there any follow-up tests or monitoring you recommend?",
      );
    }

    return {
      summary,
      abnormal_values: abnormalValues,
      uncertainty,
      recommended_questions,
      clinical_citations: verified.citations,
    };
  },
});

export const reportWorkflow = createWorkflow({
  id: "report-workflow",
  inputSchema: ReportInputSchema,
  outputSchema: ReportOutputSchema,
})
  .then(parseStep)
  .then(analyzeStep)
  .then(finalizeStep)
  .commit();
