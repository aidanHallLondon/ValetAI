import { describe, it, expect } from "vitest";
import { db, hasColumn, applyMigrations, MIGRATIONS } from "../src/db";

describe("Database Migrations & Ledger", () => {
  it("creates the migrations tracking ledger table", () => {
    const tableCheck = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_schema_migrations'"
      )
      .get() as { name: string } | undefined;

    expect(tableCheck).toBeDefined();
    expect(tableCheck?.name).toBe("_schema_migrations");
  });

  it("accurately detects existing columns using hasColumn", () => {
    expect(hasColumn(db, "content", "id")).toBe(true);
    expect(hasColumn(db, "content", "status")).toBe(true);
    expect(hasColumn(db, "content", "canonical_url")).toBe(true);
    expect(hasColumn(db, "content", "non_existent_column_xyz")).toBe(false);
  });

  it("applies all registered migrations", () => {
    const applied = db
      .prepare("SELECT id FROM _schema_migrations")
      .all() as Array<{ id: string }>;
    const appliedSet = new Set(applied.map((r) => r.id));

    for (const migration of MIGRATIONS) {
      expect(appliedSet.has(migration.id)).toBe(true);
    }
  });

  it("is idempotent when applied repeatedly", () => {
    // Second run should detect that all migrations are already applied and apply 0 new ones
    const newlyApplied = applyMigrations(db);
    expect(newlyApplied).toBe(0);
  });
});

