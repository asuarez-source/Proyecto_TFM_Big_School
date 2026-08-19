# ADR 0001: monolito modular sobre el esquema MySQL existente

- Estado: aceptada
- Fecha: 2026-08-19

## Contexto

El MVP necesita una aplicación cliente-servidor que conserve catálogos documentales, estudios técnicos e historial de revisiones. El esquema MySQL existente es la fuente de verdad inicial.

## Decisión

- Mantener un monorepo con `apps/api`, `apps/client` y `packages/contracts`.
- Implementar la API como monolito modular NestJS sobre Express.
- Usar Sequelize mediante `@nestjs/sequelize`, con mapeo explícito y sin sincronización automática destructiva o alteradora.
- Implementar reglas de compatibilidad en servicios de aplicación o dominio.
- Incorporar OCR, Redis y almacenamiento mediante puertos y adaptadores solo cuando una vertical los necesite.

## Consecuencias

- Los módulos se despliegan juntos, pero no acceden a modelos privados de otros módulos.
- Los cambios de esquema posteriores requieren migraciones versionadas.
- Los contratos compartidos no dependen de NestJS, Angular ni Sequelize.
- La primera vertical consulta el catálogo CANBus y no realiza OCR ni confirma compatibilidad.
