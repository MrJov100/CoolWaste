import { WasteType } from "@prisma/client";

const DEFAULT_AI_BASE_URL = "https://celvin77-coolwasteai.hf.space";
const DEFAULT_AUTO_APPLY_THRESHOLD = 0.85;

const WASTE_TYPE_MAP: Record<string, WasteType> = {
  plastic: WasteType.PLASTIC,
  paper: WasteType.PAPER,
  organic: WasteType.ORGANIC,
  metal: WasteType.METAL,
  glass: WasteType.GLASS,
};

type JsonRecord = Record<string, unknown>;

export type WasteCandidate = {
  wasteType: WasteType;
  confidence: number | null;
};

export type WasteClassificationResult = {
  predictedClass: WasteType | null;
  rawPredictedClass: string | null;
  confidence: number | null;
  reviewRequired: boolean;
  autoApplied: boolean;
  caseId: string | null;
  candidates: WasteCandidate[];
  raw: unknown;
};

export function getWasteClassifierBaseUrl() {
  return process.env.COOLWASTE_AI_BASE_URL?.trim() || DEFAULT_AI_BASE_URL;
}

export async function classifyWasteImage(file: File): Promise<WasteClassificationResult> {
  const formData = new FormData();
  formData.set("file", file, file.name);

  const response = await fetch(`${getWasteClassifierBaseUrl()}/predict?verbose=true`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      pickString(payload, ["detail", "message", "error"]) ||
      "AI classifier tidak dapat memproses gambar saat ini.";
    throw new Error(message);
  }

  return normalizeWasteClassificationPayload(payload);
}

export function normalizeWasteClassificationPayload(payload: unknown): WasteClassificationResult {
  const predictedClassRaw = findPredictedClass(payload);
  const predictedClass = mapWasteType(predictedClassRaw);
  const confidence = findConfidence(payload);
  const reviewRequired = findReviewRequired(payload);
  const candidates = findCandidates(payload);
  const autoApplied =
    predictedClass !== null &&
    !reviewRequired &&
    (findBoolean(payload, ["auto_approved", "high_confidence", "approved"]) ??
      (confidence !== null ? confidence >= DEFAULT_AUTO_APPLY_THRESHOLD : false));

  return {
    predictedClass,
    rawPredictedClass: predictedClassRaw,
    confidence,
    reviewRequired,
    autoApplied,
    caseId: findString(payload, ["case_id", "id"]),
    candidates,
    raw: payload,
  };
}

function findPredictedClass(payload: unknown): string | null {
  return (
    findString(payload, [
      "predicted_class",
      "predicted_label",
      "class",
      "label",
      "waste_class",
      "prediction",
    ]) ||
    findStringInNestedPrediction(payload)
  );
}

function findStringInNestedPrediction(payload: unknown): string | null {
  const candidates = [
    getNestedValue(payload, ["prediction", "class"]),
    getNestedValue(payload, ["prediction", "label"]),
    getNestedValue(payload, ["result", "class"]),
    getNestedValue(payload, ["result", "label"]),
  ];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item;
    }
  }

  return null;
}

function findConfidence(payload: unknown): number | null {
  return (
    findNumber(payload, ["confidence", "score", "probability"]) ??
    findNestedNumber(payload, [
      ["prediction", "confidence"],
      ["prediction", "score"],
      ["result", "confidence"],
      ["result", "score"],
    ]) ??
    findCandidates(payload)[0]?.confidence ??
    null
  );
}

function findReviewRequired(payload: unknown) {
  return (
    findBoolean(payload, ["review_required", "needs_review", "manual_review_required", "is_ambiguous"]) ??
    findNestedBoolean(payload, [
      ["routing", "review_required"],
      ["routing", "needs_review"],
      ["flags", "review_required"],
    ]) ??
    false
  );
}

function findCandidates(payload: unknown): WasteCandidate[] {
  const arrays = [
    getNestedValue(payload, ["top_predictions"]),
    getNestedValue(payload, ["predictions"]),
    getNestedValue(payload, ["candidates"]),
  ];

  for (const item of arrays) {
    if (!Array.isArray(item)) continue;

    const mapped = item
      .map((entry) => {
        if (typeof entry === "string") {
          const wasteType = mapWasteType(entry);
          return wasteType ? { wasteType, confidence: null } : null;
        }

        if (!isRecord(entry)) return null;

        const rawLabel =
          pickString(entry, ["class", "label", "name", "predicted_class", "predicted_label"]) || null;
        const wasteType = mapWasteType(rawLabel);
        if (!wasteType) return null;

        return {
          wasteType,
          confidence: pickNumber(entry, ["confidence", "score", "probability"]),
        };
      })
      .filter((value): value is WasteCandidate => value !== null);

    if (mapped.length) {
      return mapped;
    }
  }

  return [];
}

function mapWasteType(value: string | null): WasteType | null {
  if (!value) return null;
  return WASTE_TYPE_MAP[value.trim().toLowerCase()] ?? null;
}

function findString(payload: unknown, keys: string[]) {
  if (!isRecord(payload)) return null;
  return pickString(payload, keys);
}

function findNumber(payload: unknown, keys: string[]) {
  if (!isRecord(payload)) return null;
  return pickNumber(payload, keys);
}

function findBoolean(payload: unknown, keys: string[]) {
  if (!isRecord(payload)) return null;
  return pickBoolean(payload, keys);
}

function findNestedNumber(payload: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = getNestedValue(payload, path);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function findNestedBoolean(payload: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = getNestedValue(payload, path);
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function getNestedValue(input: unknown, path: string[]) {
  let current: unknown = input;

  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }
    current = current[segment];
  }

  return current;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(record: JsonRecord | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function pickNumber(record: JsonRecord | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function pickBoolean(record: JsonRecord | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}
