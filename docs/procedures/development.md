# Desarrollo local

## Requisitos

- Node.js 24 o posterior compatible con Angular 21.
- MySQL 8 con el esquema `technical_studies` creado desde `database/schema/technical_studies_unified.sql`.

## Configuración

1. Copiar `.env.example` a `.env` sin versionar.
2. Crear un usuario MySQL de aplicación con los permisos mínimos necesarios.
3. Completar las variables `DB_*` y la lista `CORS_ORIGINS`.
4. Ejecutar `npm install` desde la raíz.

La API no ejecuta `sequelize.sync`, no crea tablas y no importa catálogos al arrancar.
El usuario configurado en `DB_USERNAME` debe tener únicamente permiso `SELECT` sobre las cuatro tablas CANBus iniciales. Las credenciales administrativas no se utilizan para arrancar la API.

## Base aislada de integración

Las pruebas destructivas no deben apuntar a la base local de desarrollo. Configurar las variables `DB_TEST_*` con un usuario separado y un nombre que termine obligatoriamente en `_test`.

1. Ejecutar `npm run db:test:init --workspace @estudio-tecnico/api`.
2. El inicializador valida el sufijo `_test`, adapta las directivas `CREATE DATABASE` y `USE` del SQL base y carga el catálogo completo.
3. Ejecutar `npm run test:integration` desde la raíz.

La inicialización elimina y vuelve a crear las tablas únicamente dentro de la base `_test`. Para restaurar ese entorno de pruebas a su estado conocido, se vuelve a ejecutar `db:test:init`; nunca se utiliza ese comando sobre `technical_studies`.

## Comandos

- `npm run build`: compila contratos, API y cliente.
- `npm run lint`: analiza los tres workspaces.
- `npm run typecheck`: comprueba TypeScript estricto.
- `npm test`: ejecuta pruebas unitarias de API y cliente.
- `npm run test:e2e`: ejecuta las pruebas HTTP de la API.
- `npm run test:integration --workspace @estudio-tecnico/api`: prueba las consultas contra la base aislada configurada mediante `DB_TEST_*`.
- `npm run db:test:init --workspace @estudio-tecnico/api`: recrea la base aislada indicada por `DB_TEST_DATABASE` desde el SQL fuente.

En desarrollo, el cliente reenvía `/api` a `http://localhost:3000`.
