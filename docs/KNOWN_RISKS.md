# Riesgos conocidos

## Dependencia transitiva `uuid` en Sequelize 6

- Detectado: 2026-08-19 mediante `npm audit`.
- Severidad informada: moderada.
- Cadena: `@nestjs/sequelize` / `sequelize-typescript` → `sequelize` → `uuid`.
- Aviso: `GHSA-w5hq-g745-h8pq`, relacionado con las variantes UUID que reciben un búfer proporcionado por el llamador.
- Exposición actual: la primera vertical solo realiza lecturas del catálogo y no invoca generación UUID mediante Sequelize.
- Mitigación: no aceptar búferes externos para generación UUID y revisar las actualizaciones oficiales de Sequelize. No se fuerza `uuid` 11 mediante `overrides` porque Sequelize 6 declara una versión anterior y ese cambio podría romper compatibilidad.
- Cierre: actualizar cuando exista una versión compatible con Sequelize y `@nestjs/sequelize`, o registrar una decisión arquitectónica antes de cambiar de ORM.

## Entorno de integración MySQL

La prueba está implementada en `apps/api/test/canbus-catalog.integration-spec.ts` y se ejecuta únicamente contra una base indicada por `DB_TEST_DATABASE` cuyo nombre termine en `_test`. El inicializador controlado reutiliza el SQL fuente y rechaza cualquier otro nombre antes de ejecutar operaciones destructivas.
