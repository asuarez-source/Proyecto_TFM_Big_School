import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { QueryTypes } from 'sequelize';
import type { ModelStatic } from 'sequelize';
import { Model, Sequelize } from 'sequelize-typescript';
import { CanbusCatalogRepository } from '../src/modules/canbus-catalog/infrastructure/canbus-catalog.repository';
import { selectCanbusCandidates } from '../src/modules/canbus-catalog/domain/canbus-candidate-selector';
import { CanbusDocumentIssueModel } from '../src/modules/canbus-catalog/infrastructure/canbus-document-issue.model';
import { CanbusDocumentPartModel } from '../src/modules/canbus-catalog/infrastructure/canbus-document-part.model';
import { CanbusDocumentModel } from '../src/modules/canbus-catalog/infrastructure/canbus-document.model';
import { CanbusManufacturerModel } from '../src/modules/canbus-catalog/infrastructure/canbus-manufacturer.model';

const envPath = resolve(__dirname, '../../../.env');
const fileEnvironment = existsSync(envPath)
  ? parseEnv(readFileSync(envPath, 'utf8'))
  : {};

function environmentValue(
  name: string,
  fallbackName?: string,
): string | undefined {
  return (
    process.env[name] ||
    fileEnvironment[name] ||
    (fallbackName
      ? process.env[fallbackName] || fileEnvironment[fallbackName]
      : undefined)
  );
}

const modelsByTable = {
  canbus_manufacturer: CanbusManufacturerModel,
  canbus_document: CanbusDocumentModel,
  canbus_document_part: CanbusDocumentPartModel,
  canbus_document_issue: CanbusDocumentIssueModel,
} as const;

interface ExpectedColumn {
  field: string;
  modelType: string;
  databaseType: string;
  nullable: boolean;
}

const expectedColumns: Record<keyof typeof modelsByTable, ExpectedColumn[]> = {
  canbus_manufacturer: [
    {
      field: 'id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'name',
      modelType: 'VARCHAR(120)',
      databaseType: 'varchar(120)',
      nullable: false,
    },
    {
      field: 'normalized_key',
      modelType: 'VARCHAR(120)',
      databaseType: 'varchar(120)',
      nullable: false,
    },
  ],
  canbus_document: [
    {
      field: 'id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'import_batch_id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'manufacturer_id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'original_filename',
      modelType: 'VARCHAR(255)',
      databaseType: 'varchar(255)',
      nullable: false,
    },
    {
      field: 'vehicle_descriptor_original',
      modelType: 'VARCHAR(255)',
      databaseType: 'varchar(255)',
      nullable: false,
    },
    {
      field: 'vehicle_descriptor_normalized',
      modelType: 'VARCHAR(255)',
      databaseType: 'varchar(255)',
      nullable: false,
    },
    {
      field: 'start_year',
      modelType: 'SMALLINT UNSIGNED',
      databaseType: 'smallint unsigned',
      nullable: true,
    },
    {
      field: 'language_code',
      modelType: 'VARCHAR(10)',
      databaseType: 'varchar(10)',
      nullable: true,
    },
    {
      field: 'file_extension',
      modelType: 'VARCHAR(20)',
      databaseType: 'varchar(20)',
      nullable: true,
    },
    {
      field: 'parse_status',
      modelType: 'VARCHAR(30)',
      databaseType: 'varchar(30)',
      nullable: false,
    },
    {
      field: 'occurrence_count',
      modelType: 'SMALLINT UNSIGNED',
      databaseType: 'smallint unsigned',
      nullable: false,
    },
    {
      field: 'source_line_first',
      modelType: 'INTEGER UNSIGNED',
      databaseType: 'int unsigned',
      nullable: false,
    },
    {
      field: 'created_at',
      modelType: 'DATETIME',
      databaseType: 'timestamp',
      nullable: false,
    },
  ],
  canbus_document_part: [
    {
      field: 'id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'document_id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'token_zone',
      modelType: 'VARCHAR(20)',
      databaseType: 'varchar(20)',
      nullable: false,
    },
    {
      field: 'token_position',
      modelType: 'SMALLINT UNSIGNED',
      databaseType: 'smallint unsigned',
      nullable: false,
    },
    {
      field: 'original_value',
      modelType: 'VARCHAR(150)',
      databaseType: 'varchar(150)',
      nullable: false,
    },
    {
      field: 'normalized_value',
      modelType: 'VARCHAR(150)',
      databaseType: 'varchar(150)',
      nullable: false,
    },
    {
      field: 'semantic_type',
      modelType: 'VARCHAR(40)',
      databaseType: 'varchar(40)',
      nullable: true,
    },
    {
      field: 'canonical_value',
      modelType: 'VARCHAR(150)',
      databaseType: 'varchar(150)',
      nullable: true,
    },
  ],
  canbus_document_issue: [
    {
      field: 'id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'document_id',
      modelType: 'BIGINT UNSIGNED',
      databaseType: 'bigint unsigned',
      nullable: false,
    },
    {
      field: 'issue_code',
      modelType: 'VARCHAR(50)',
      databaseType: 'varchar(50)',
      nullable: false,
    },
    {
      field: 'issue_message',
      modelType: 'VARCHAR(255)',
      databaseType: 'varchar(255)',
      nullable: false,
    },
  ],
};

const expectedIndexes = [
  {
    tableName: 'canbus_document',
    indexName: 'fk_canbus_document_batch',
    unique: false,
    fields: ['import_batch_id'],
  },
  {
    tableName: 'canbus_document',
    indexName: 'ix_canbus_document_lookup',
    unique: false,
    fields: ['manufacturer_id', 'vehicle_descriptor_normalized', 'start_year'],
  },
  {
    tableName: 'canbus_document',
    indexName: 'ix_canbus_document_status',
    unique: false,
    fields: ['parse_status'],
  },
  {
    tableName: 'canbus_document',
    indexName: 'uq_canbus_document_original_filename',
    unique: true,
    fields: ['original_filename'],
  },
  {
    tableName: 'canbus_document_issue',
    indexName: 'ix_canbus_issue_code',
    unique: false,
    fields: ['issue_code'],
  },
  {
    tableName: 'canbus_document_issue',
    indexName: 'ix_canbus_issue_document',
    unique: false,
    fields: ['document_id'],
  },
  {
    tableName: 'canbus_document_part',
    indexName: 'ix_canbus_part_semantic',
    unique: false,
    fields: ['semantic_type', 'normalized_value'],
  },
  {
    tableName: 'canbus_document_part',
    indexName: 'uq_canbus_part_position',
    unique: true,
    fields: ['document_id', 'token_zone', 'token_position'],
  },
  {
    tableName: 'canbus_manufacturer',
    indexName: 'uq_canbus_manufacturer_normalized_key',
    unique: true,
    fields: ['normalized_key'],
  },
] as const;

interface DatabaseColumn {
  tableName: keyof typeof modelsByTable;
  field: string;
  databaseType: string;
  isNullable: 'YES' | 'NO';
  collation: string | null;
}

interface DatabaseIndex {
  tableName: keyof typeof modelsByTable;
  indexName: string;
  nonUnique: number;
  sequence: number;
  field: string;
}

interface DatabaseForeignKey {
  tableName: keyof typeof modelsByTable;
  field: string;
  referencedTable: string;
  referencedField: string;
  deleteRule: string;
}

function hasToSql(value: unknown): value is { toSql: () => string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toSql' in value &&
    typeof value.toSql === 'function'
  );
}

function dataTypeToSql(dataType: unknown): string {
  if (hasToSql(dataType)) {
    return dataType.toSql();
  }
  if (typeof dataType === 'string') {
    return dataType;
  }
  throw new Error('Unsupported Sequelize data type metadata.');
}

function indexFieldName(field: unknown): string {
  if (typeof field === 'string') {
    return field;
  }
  if (
    typeof field === 'object' &&
    field !== null &&
    'name' in field &&
    typeof field.name === 'string'
  ) {
    return field.name;
  }
  throw new Error('Unsupported Sequelize index field metadata.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function associationDeleteRule(association: unknown): string | undefined {
  if (!isRecord(association) || !isRecord(association['options'])) {
    return undefined;
  }
  const rule = association['options']['onDelete'];
  return typeof rule === 'string' ? rule : undefined;
}

describe('CanbusCatalogRepository (MySQL integration)', () => {
  let sequelize: Sequelize;
  let databaseName: string;

  beforeAll(async () => {
    databaseName = environmentValue('DB_TEST_DATABASE') ?? '';
    if (!/^[a-zA-Z0-9_]+_test$/.test(databaseName)) {
      throw new Error('DB_TEST_DATABASE must be configured and end in _test.');
    }

    sequelize = new Sequelize({
      dialect: 'mysql',
      host: environmentValue('DB_TEST_HOST', 'DB_HOST'),
      port: Number(environmentValue('DB_TEST_PORT', 'DB_PORT')),
      username: environmentValue('DB_TEST_USERNAME', 'DB_USERNAME'),
      password: environmentValue('DB_TEST_PASSWORD', 'DB_PASSWORD'),
      database: databaseName,
      logging: false,
      timezone: '+00:00',
      models: Object.values(modelsByTable),
    });
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize?.close();
  });

  it('maps every column with the expected field, type and nullability', async () => {
    const databaseColumns = await sequelize.query<DatabaseColumn>(
      `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS field,
              COLUMN_TYPE AS databaseType, IS_NULLABLE AS isNullable,
              COLLATION_NAME AS collation
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = :databaseName
          AND TABLE_NAME IN (:tableNames)
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      {
        replacements: {
          databaseName,
          tableNames: Object.keys(modelsByTable),
        },
        type: QueryTypes.SELECT,
      },
    );

    for (const [tableName, expected] of Object.entries(expectedColumns) as [
      keyof typeof modelsByTable,
      ExpectedColumn[],
    ][]) {
      const model = modelsByTable[tableName] as ModelStatic<Model>;
      const modelAttributes = Object.values(model.getAttributes());
      expect(modelAttributes).toHaveLength(expected.length);
      expect(
        modelAttributes
          .filter((attribute) => attribute.primaryKey === true)
          .map((attribute) => attribute.field),
      ).toEqual(['id']);
      expect(
        modelAttributes.map((attribute) => ({
          field: attribute.field,
          modelType: dataTypeToSql(attribute.type),
          nullable: attribute.allowNull === true,
        })),
      ).toEqual(
        expected.map(({ field, modelType, nullable }) => ({
          field,
          modelType,
          nullable,
        })),
      );

      expect(
        databaseColumns
          .filter((column) => column.tableName === tableName)
          .map((column) => ({
            field: column.field,
            databaseType: column.databaseType,
            nullable: column.isNullable === 'YES',
          })),
      ).toEqual(
        expected.map(({ field, databaseType, nullable }) => ({
          field,
          databaseType,
          nullable,
        })),
      );
    }

    expect(
      databaseColumns.find(
        (column) =>
          column.tableName === 'canbus_document' &&
          column.field === 'original_filename',
      )?.collation,
    ).toBe('utf8mb4_0900_as_cs');
  });

  it('preserves the SQL index definitions in Sequelize metadata', async () => {
    const databaseIndexes = await sequelize.query<DatabaseIndex>(
      `SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName,
              NON_UNIQUE AS nonUnique, SEQ_IN_INDEX AS sequence,
              COLUMN_NAME AS field
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = :databaseName
          AND TABLE_NAME IN (:tableNames)
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
      {
        replacements: { databaseName, tableNames: Object.keys(modelsByTable) },
        type: QueryTypes.SELECT,
      },
    );
    const sortIndexDefinitions = <
      T extends { tableName: string; indexName: string },
    >(
      left: T,
      right: T,
    ): number =>
      `${left.tableName}:${left.indexName}`.localeCompare(
        `${right.tableName}:${right.indexName}`,
      );
    const expectedDefinitions = [...expectedIndexes].sort(sortIndexDefinitions);
    const databaseDefinitions = expectedIndexes
      .map((expected) => {
        const rows = databaseIndexes.filter(
          (index) =>
            index.tableName === expected.tableName &&
            index.indexName === expected.indexName,
        );
        return {
          tableName: expected.tableName,
          indexName: expected.indexName,
          unique: rows[0]?.nonUnique === 0,
          fields: rows.map((row) => row.field),
        };
      })
      .sort(sortIndexDefinitions);
    const modelDefinitions = (
      Object.entries(modelsByTable) as [
        keyof typeof modelsByTable,
        ModelStatic<Model>,
      ][]
    )
      .flatMap(([tableName, model]) =>
        (model.options.indexes ?? []).map((index) => ({
          tableName,
          indexName: index.name ?? '',
          unique: index.unique === true,
          fields: (index.fields ?? []).map(indexFieldName),
        })),
      )
      .sort(sortIndexDefinitions);

    expect(databaseDefinitions).toEqual(expectedDefinitions);
    expect(modelDefinitions).toEqual(expectedDefinitions);
    expect(
      databaseIndexes
        .filter((index) => index.indexName === 'PRIMARY')
        .map((index) => ({ tableName: index.tableName, field: index.field })),
    ).toEqual(
      Object.keys(modelsByTable)
        .sort()
        .map((tableName) => ({ tableName, field: 'id' })),
    );
  });

  it('keeps the existing foreign keys and delete rules', async () => {
    const foreignKeys = await sequelize.query<DatabaseForeignKey>(
      `SELECT kcu.TABLE_NAME AS tableName, kcu.COLUMN_NAME AS field,
              kcu.REFERENCED_TABLE_NAME AS referencedTable,
              kcu.REFERENCED_COLUMN_NAME AS referencedField,
              rc.DELETE_RULE AS deleteRule
         FROM information_schema.KEY_COLUMN_USAGE kcu
         JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
           ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
          AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
          AND rc.TABLE_NAME = kcu.TABLE_NAME
        WHERE kcu.CONSTRAINT_SCHEMA = :databaseName
          AND kcu.TABLE_NAME IN (:tableNames)
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME`,
      {
        replacements: { databaseName, tableNames: Object.keys(modelsByTable) },
        type: QueryTypes.SELECT,
      },
    );

    expect(foreignKeys).toEqual([
      {
        tableName: 'canbus_document',
        field: 'import_batch_id',
        referencedTable: 'canbus_import_batch',
        referencedField: 'id',
        deleteRule: 'NO ACTION',
      },
      {
        tableName: 'canbus_document',
        field: 'manufacturer_id',
        referencedTable: 'canbus_manufacturer',
        referencedField: 'id',
        deleteRule: 'NO ACTION',
      },
      {
        tableName: 'canbus_document_issue',
        field: 'document_id',
        referencedTable: 'canbus_document',
        referencedField: 'id',
        deleteRule: 'CASCADE',
      },
      {
        tableName: 'canbus_document_part',
        field: 'document_id',
        referencedTable: 'canbus_document',
        referencedField: 'id',
        deleteRule: 'CASCADE',
      },
    ]);
  });

  it('exposes only the associations needed by the four-model boundary', () => {
    expect(Object.keys(CanbusManufacturerModel.associations)).toEqual([
      'documents',
    ]);
    expect(Object.keys(CanbusDocumentModel.associations).sort()).toEqual([
      'issues',
      'manufacturer',
      'parts',
    ]);
    expect(Object.keys(CanbusDocumentPartModel.associations)).toEqual([
      'document',
    ]);
    expect(Object.keys(CanbusDocumentIssueModel.associations)).toEqual([
      'document',
    ]);
    expect(
      associationDeleteRule(CanbusDocumentPartModel.associations.document),
    ).toBe('CASCADE');
    expect(
      associationDeleteRule(CanbusDocumentIssueModel.associations.document),
    ).toBe('CASCADE');
    expect(
      CanbusDocumentModel.getAttributes().importBatchId.references,
    ).toBeUndefined();
  });

  it('reads the seeded SEAT ARONA catalog without synchronizing the schema', async () => {
    const repository = new CanbusCatalogRepository(
      CanbusManufacturerModel,
      CanbusDocumentModel,
    );

    await expect(repository.manufacturerExists('seat')).resolves.toBe(true);
    const documents = await repository.findDocumentsByManufacturer('seat');
    expect(
      documents.some(
        (document) => document.vehicleDescriptorNormalized === 'arona_kj',
      ),
    ).toBe(true);
  });

  it('selects the seeded Ford Puma K2 2020 document for a 2022 vehicle', async () => {
    const repository = new CanbusCatalogRepository(
      CanbusManufacturerModel,
      CanbusDocumentModel,
    );
    const documents = await repository.findDocumentsByManufacturer('ford');
    const result = selectCanbusCandidates(documents, {
      manufacturer: 'Ford',
      model: 'Puma K2',
      year: 2022,
    });

    expect(result.status).toBe('MATCHED');
    expect(result.decisionCodes).toContain('YEAR_INTERVAL_MATCH');
    expect(result.selectedDocument?.originalFilename).toBe(
      'FORD_PUMA_K2_2020_en.pdf',
    );
  });

  it('selects the seeded Citroën Berlingo document by VIN prefix', async () => {
    const repository = new CanbusCatalogRepository(
      CanbusManufacturerModel,
      CanbusDocumentModel,
    );
    const documents = await repository.findDocumentsByManufacturer('citroen');
    const result = selectCanbusCandidates(documents, {
      manufacturer: 'Citroën',
      model: 'Berlingo',
      year: 2008,
      vin: '143ABC12345678901',
    });

    expect(result.status).toBe('MATCHED');
    expect(result.decisionCodes).toContain('VIN_PREFIX_MATCH');
    expect(result.selectedDocument?.originalFilename).toBe(
      'CITROEN_BERLINGO_2008_143_en.pdf',
    );
  });
});
