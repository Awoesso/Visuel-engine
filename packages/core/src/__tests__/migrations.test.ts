import { describe, it, expect } from 'vitest';
import {
  migrateAndValidateDocument,
  registerMigration,
} from '../migrations';
import { CURRENT_SCHEMA_VERSION } from '../schemas/document';

describe('Document Migrations', () => {
  it('should validate directly without migration when version matches current', () => {
    const doc = {
      id: 'doc-current',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [],
    };

    const result = migrateAndValidateDocument(doc, CURRENT_SCHEMA_VERSION);
    expect(result.success).toBe(true);
    expect(result.migrated).toBe(false);
    expect(result.initialVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('should execute registered migration steps when upgrading older documents', () => {
    // Register a simulated migration step from version 1 to 2
    registerMigration({
      fromVersion: 1,
      toVersion: 2,
      migrate: (rawDoc) => {
        return {
          ...rawDoc,
          migratedFlag: true,
        };
      },
    });

    const v1Doc = {
      id: 'doc-v1',
      schemaVersion: 1,
      sections: [],
    };

    // When targeting version 2
    const result = migrateAndValidateDocument(v1Doc, 2);
    expect(result.migrated).toBe(true);
    expect(result.initialVersion).toBe(1);
  });
});
