# Base de datos del proyecto

## Esquema base actual

`schema/technical_studies_unified.sql` es la fuente de verdad inicial y contiene la versión completa del esquema MySQL `technical_studies`, incluidos:

- catálogos CANBus;
- compatibilidad de tacógrafos;
- clientes, vehículos y estudios;
- historial de evaluaciones;
- caché documental y parámetros CANBus;
- soporte para OCR bajo demanda.

La base del proyecto parte directamente de esta versión. No hay migraciones anteriores pendientes de ejecución.

## Crear una base nueva

El esquema completo se utiliza únicamente para crear una base vacía:

```bash
mysql -u usuario -p < database/schema/technical_studies_unified.sql
```

No debe ejecutarse sobre una base en uso o con datos, porque es un script completo de creación que elimina y vuelve a crear las tablas del esquema.

## Estado inicial del repositorio

La estructura inicial es:

```text
database/
├── schema/
│   └── technical_studies_unified.sql
└── README.md
```

No es necesario crear un directorio de migraciones vacío. Se añadirá cuando exista el primer cambio real posterior al esquema base.

## Cambios futuros

Cuando sea necesario modificar el esquema:

1. Crear `database/migrations/`.
2. Añadir una migración nueva, ordenada y versionada.
3. No modificar una migración que ya se haya aplicado en otro entorno.
4. Registrar qué migraciones se han ejecutado.
5. Probar la migración sobre una base de desarrollo o una copia recuperable.
6. Preparar una estrategia de reversión o restauración antes de cambios destructivos.

Ejemplo futuro:

```text
database/
├── schema/
│   └── technical_studies_unified.sql
├── migrations/
│   └── 0001_descripcion_del_cambio.sql
└── README.md
```

## Reglas para la aplicación

- Sequelize debe mapear explícitamente las tablas del esquema existente.
- No utilizar `sequelize.sync({ force: true })`.
- No utilizar `sequelize.sync({ alter: true })`.
- No importar o regenerar los catálogos durante el arranque de la API.
- Los cambios del esquema se realizan mediante migraciones controladas.
- El SQL completo no se ejecuta automáticamente al iniciar la aplicación.
- Las credenciales se proporcionan mediante variables de entorno y nunca se guardan en Git.

## Nota sobre la antigua migración OCR

La migración denominada `migration_v2_canbus_ocr_cache.sql` solo servía para actualizar una versión anterior del esquema. Sus cambios ya están incluidos en `technical_studies_unified.sql`.

Por tanto, esa migración:

- no debe ejecutarse;
- no debe incluirse en `database/migrations/`;
- no necesita formar parte del repositorio de la aplicación que comienza desde el esquema actual.

