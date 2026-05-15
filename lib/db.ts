import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Inspection, InspectionResult } from "@/types";

interface RenovationDB extends DBSchema {
  inspections: {
    key: string;
    value: Inspection;
    indexes: { byCreatedAt: number };
  };
  inspection_results: {
    key: string;
    value: InspectionResult;
  };
}

let dbPromise: Promise<IDBPDatabase<RenovationDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RenovationDB>("renovation-inspector", 1, {
      upgrade(db) {
        const inspStore = db.createObjectStore("inspections", { keyPath: "id" });
        inspStore.createIndex("byCreatedAt", "createdAt");
        db.createObjectStore("inspection_results", { keyPath: "inspectionId" });
      },
    });
  }
  return dbPromise;
}

export async function saveInspection(inspection: Inspection) {
  const db = await getDB();
  await db.put("inspections", inspection);
}

export async function getInspection(id: string): Promise<Inspection | undefined> {
  const db = await getDB();
  return db.get("inspections", id);
}

export async function getAllInspections(): Promise<Inspection[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("inspections", "byCreatedAt");
  return all.reverse();
}

export async function deleteInspection(id: string) {
  const db = await getDB();
  await db.delete("inspections", id);
  await db.delete("inspection_results", id);
}

export async function saveInspectionResult(result: InspectionResult) {
  const db = await getDB();
  await db.put("inspection_results", result);
}

export async function getInspectionResult(
  inspectionId: string
): Promise<InspectionResult | undefined> {
  const db = await getDB();
  return db.get("inspection_results", inspectionId);
}
