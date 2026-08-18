# AGENTS.md

## Proyecto

Aplicación cliente-servidor para gestionar estudios técnicos de compatibilidad de vehículos con:

- lecturas CANBus;
- descarga remota de tacógrafos;
- historial de clientes, vehículos, estudios y revisiones;
- extracción OCR bajo demanda y reutilización de resultados mediante caché.

El proyecto es un TFM de desarrollo asistido por IA. La calidad del proceso, la trazabilidad de las decisiones, las pruebas y la validación humana son requisitos del proyecto, no tareas opcionales.

## Arquitectura obligatoria

- Frontend multiplataforma: Ionic, Angular y Capacitor.
- Backend: NestJS sobre Express, organizado como monolito modular.
- Comunicación: API REST documentada con OpenAPI.
- Persistencia: MySQL y Sequelize mediante `@nestjs/sequelize`.
- Redis, OCR y almacenamiento documental se incorporarán por adaptadores cuando corresponda; no deben alterar la arquitectura principal.
- TypeScript estricto en frontend y backend.

No introducir microservicios, GraphQL, otro ORM, otra base de datos ni otro framework frontend sin una decisión arquitectónica aprobada.

## Organización esperada

Repositorio monolítico con espacios de trabajo:

- `apps/api`: backend NestJS.
- `apps/client`: Ionic/Angular/Capacitor.
- `packages/contracts`: contratos y tipos compartidos que no dependan de NestJS ni Angular.
- `database`: SQL de instalación, migraciones y documentación del esquema.
- `docs`: contexto funcional, arquitectura, decisiones ADR y procedimientos.

Mantener los módulos del backend desacoplados. Un módulo no accede directamente a los modelos privados de otro: utiliza sus servicios públicos o contratos explícitos.

## Módulos funcionales previstos

- `clients`
- `vehicles`
- `studies`
- `assessments`
- `canbus-catalog`
- `canbus-analysis`
- `tachograph-catalog`
- `documents`
- `users-auth`
- `audit`
- `health`

No es obligatorio crear todos los módulos en el primer cambio. Implementarlos por verticales funcionales pequeñas.

## Base de datos

La fuente de verdad inicial es `database/technical_studies_unified.sql` y su documentación asociada.

Reglas obligatorias:

- Inspeccionar el SQL antes de crear modelos Sequelize.
- Mapear nombres reales de tablas, columnas, claves, nulabilidad, índices y relaciones; no inventarlos.
- Usar migraciones versionadas para cambios de esquema.
- No usar `sequelize.sync({ force: true })` ni `sequelize.sync({ alter: true })`.
- No borrar ni regenerar datos del catálogo CANBus o tacógrafos durante pruebas o arranque.
- No implementar reglas de compatibilidad mediante triggers o procedimientos almacenados.
- Mantener las reglas de negocio en servicios del backend.
- Utilizar transacciones para crear o modificar estudios, revisiones y resultados relacionados.
- Preservar el historial: una corrección crea una nueva `assessment_revision`; no sobrescribe revisiones anteriores.
- Tratar los catálogos CANBus y tacógrafos como datos de referencia trazables.
- La caché de análisis CANBus se identifica por documento, SHA-256 del PDF y versión del esquema de extracción.
- Un resultado aplicado a un vehículo debe copiarse en las tablas históricas del estudio para que futuras actualizaciones documentales no lo modifiquen retroactivamente.

## Reglas funcionales relevantes

- CANBus: la aplicación selecciona candidatos por fabricante, modelo, año y calificadores del documento, incluidos VIN, propulsión, variante, mercado o sistema de acceso cuando existan.
- No confundir la existencia de un documento con una decisión automáticamente confirmada: algunos casos requieren revisión.
- El campo `from` del PDF se conserva como `valid_from_date`; no debe reinterpretarse sin evidencia como fecha de modificación.
- Parámetros CANBus normalizados: velocidad, posición del acelerador, consumo total, nivel de combustible, RPM, kilometraje total y temperatura del motor.
- Una ausencia solo equivale a `NOT_AVAILABLE` cuando la extracción terminó correctamente. Un fallo OCR o una confianza insuficiente produce `UNKNOWN` o `REVIEW_REQUIRED`.
- Tacógrafos: distinguir siempre datos documentales, reglas, inferencias, excepciones y revisiones manuales.
- Los resultados pendientes nunca deben presentarse como confirmados.

## Convenciones de backend

- Controladores finos: validan entrada, autorizan y delegan.
- Casos de uso y reglas en servicios de aplicación o dominio.
- Acceso a datos encapsulado en repositorios o servicios de persistencia del módulo.
- DTO de entrada con `class-validator` y transformación explícita.
- Respuestas y errores con un formato estable.
- No devolver modelos Sequelize directamente desde los controladores.
- No exponer campos internos, hashes, rutas de almacenamiento ni datos de auditoría salvo que el contrato lo requiera.
- Evitar `any`; documentar cualquier excepción.
- Fechas en API con ISO 8601 y almacenamiento coherente en UTC, salvo fechas de calendario como `valid_from_date`.
- Matrículas e identificadores deben normalizarse en la capa de aplicación y conservar también el valor original cuando el esquema lo permita.

## Seguridad

- Nunca incluir secretos, contraseñas o tokens en Git.
- Validar variables de entorno al iniciar.
- Usar consultas parametrizadas a través de Sequelize.
- Configurar CORS mediante lista permitida por entorno.
- Incorporar Helmet, límites de tamaño de petición y rate limiting cuando se expongan endpoints externos.
- Validar tipo, tamaño, extensión y firma real de archivos antes de almacenarlos o procesarlos.
- No permitir que nombres de archivo controlen rutas del sistema.
- Los permisos y roles se validan en el backend, no solo en la interfaz.
- Registrar eventos sensibles sin almacenar secretos ni documentos completos en logs.

## Pruebas y calidad

Cada cambio funcional debe incluir las pruebas adecuadas:

- unitarias para reglas y casos de uso;
- integración para Sequelize y consultas relevantes;
- e2e para endpoints principales;
- pruebas frontend para servicios y componentes con lógica significativa.

Antes de dar una tarea por terminada:

1. Ejecutar formato, lint y comprobación de tipos.
2. Ejecutar las pruebas afectadas.
3. Revisar el diff completo.
4. Confirmar que no se modificaron archivos ajenos al encargo.
5. Resumir cambios, pruebas realizadas, riesgos y decisiones pendientes.

No afirmar que una prueba pasó si no se ejecutó. Si el entorno impide ejecutarla, explicar exactamente qué falta.

## Forma de trabajar con Codex

- Para tareas complejas, presentar primero un plan y esperar aprobación antes de implementar.
- Antes de cambiar arquitectura, dependencias de producción o esquema de datos, explicar alternativas y solicitar aprobación.
- No hacer refactorizaciones amplias no solicitadas.
- Mantener cambios pequeños y revisables.
- Cuando falte información funcional, preguntar en lugar de inventar una regla.
- Al descubrir una contradicción entre documentación, SQL y código, detener la implementación de esa parte y presentar la evidencia.
- Crear o actualizar una ADR cuando una decisión cambie arquitectura, persistencia, seguridad o integraciones.

## Definición general de terminado

Un trabajo está terminado cuando:

- cumple el criterio funcional solicitado;
- respeta la arquitectura y el esquema de datos;
- tiene pruebas proporcionadas al riesgo;
- lint, tipos y pruebas relevantes pasan;
- OpenAPI refleja los endpoints modificados;
- la documentación afectada está actualizada;
- el diff ha sido revisado y no contiene secretos ni cambios accidentales.

