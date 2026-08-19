# API

Backend NestJS/Express del sistema de estudios técnicos.

La primera vertical expone:

- `GET /api/health`;
- `GET /api/canbus-catalog/candidates`;
- OpenAPI en `/api/docs`.

La conexión Sequelize mapea el esquema existente y mantiene `synchronize: false`. La configuración y los comandos reproducibles se describen en `docs/procedures/development.md`.
