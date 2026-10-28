import { CURRENT_SCHEMA_VERSION } from '../schemas/document';
import { validatePageDocument, type ValidationResult } from '../validation/validate';

export type MigrationFunction = (rawDoc: Record<string, unknown>) => Record<string, unknown>;

export interface MigrationStep {
  fromVersion: number;
  toVersion: number;
  migrate: MigrationFunction;
}

const migrationRegistry: MigrationStep[] = [
  // Future schema migrations will be registered here sequentially (e.g. 1 -> 2, 2 -> 3)
];

/**
 * Registers a new migration step between two consecutive schema versions.
 */
export function registerMigration(migration: MigrationStep): void {
  migrationRegistry.push(migration);
}

/**
 * Migrates a raw page document from its declared schemaVersion to the current targetVersion,
 * then validates the final result against the target schema.
 */
export function migrateAndValidateDocument(
  rawInput: unknown,
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): ValidationResult & { migrated: boolean; initialVersion: number } {
  if (!rawInput || typeof rawInput !== 'object') {
    return {
      success: false,
      migrated: false,
      initialVersion: 0,
      errors: [{ path: 'root', message: 'Input must be a valid JSON object' }],
    };
  }

  const rawDoc = { ...(rawInput as Record<string, unknown>) };
  const initialVersion = typeof rawDoc.schemaVersion === 'number' ? rawDoc.schemaVersion : 1;

  if (initialVersion === targetVersion) {
    const valResult = validatePageDocument(rawDoc);
    return {
      ...valResult,
      migrated: false,
      initialVersion,
    };
  }

  if (initialVersion > targetVersion) {
    return {
      success: false,
      migrated: false,
      initialVersion,
      errors: [
        {
          path: 'schemaVersion',
          message: `Document schema version (${initialVersion}) is higher than supported target version (${targetVersion})`,
        },
      ],
    };
  }

  let currentVersion = initialVersion;
  let currentDoc = rawDoc;
  let didMigrate = false;

  while (currentVersion < targetVersion) {
    const step = migrationRegistry.find(
      (m) => m.fromVersion === currentVersion && m.toVersion === currentVersion + 1,
    );

    if (!step) {
      return {
        success: false,
        migrated: didMigrate,
        initialVersion,
        errors: [
          {
            path: 'schemaVersion',
            message: `No migration path found from schema version ${currentVersion} to ${currentVersion + 1}`,
          },
        ],
      };
    }

    try {
      currentDoc = step.migrate(currentDoc);
      currentVersion = step.toVersion;
      currentDoc.schemaVersion = currentVersion;
      didMigrate = true;
    } catch (err) {
      return {
        success: false,
        migrated: didMigrate,
        initialVersion,
        errors: [
          {
            path: 'migration',
            message: `Migration failed from version ${step.fromVersion} to ${step.toVersion}: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }

  const validationResult = validatePageDocument(currentDoc);
  return {
    ...validationResult,
    migrated: didMigrate,
    initialVersion,
  };
}
