import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createConnection } from 'mysql2/promise';

const workspaceRoot = resolve(__dirname, '../../..');
const envPath = resolve(workspaceRoot, '.env');
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function required(name: string, fallbackName?: string): string {
  const value =
    process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function initialize(): Promise<void> {
  const database = required('DB_TEST_DATABASE');
  if (!/^[a-zA-Z0-9_]+_test$/.test(database)) {
    throw new Error('DB_TEST_DATABASE must be an identifier ending in _test.');
  }

  const schemaPath = resolve(
    workspaceRoot,
    'database/schema/technical_studies_unified.sql',
  );
  const sourceSql = readFileSync(schemaPath, 'utf8');
  const createStatement = 'CREATE DATABASE IF NOT EXISTS technical_studies';
  const useStatement = 'USE technical_studies;';
  if (
    !sourceSql.includes(createStatement) ||
    !sourceSql.includes(useStatement)
  ) {
    throw new Error(
      'The base SQL no longer contains the expected database directives.',
    );
  }

  const testSql = sourceSql
    .replace(createStatement, `CREATE DATABASE IF NOT EXISTS \`${database}\``)
    .replace(useStatement, `USE \`${database}\`;`);
  const connection = await createConnection({
    host: required('DB_TEST_HOST', 'DB_HOST'),
    port: Number(required('DB_TEST_PORT', 'DB_PORT')),
    user: required('DB_TEST_USERNAME', 'DB_USERNAME'),
    password: required('DB_TEST_PASSWORD', 'DB_PASSWORD'),
    multipleStatements: true,
  });

  try {
    await connection.query(testSql);
  } finally {
    await connection.end();
  }

  console.log(`Test database initialized: ${database}`);
}

void initialize();
