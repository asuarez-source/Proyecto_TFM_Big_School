# Contexto del proyecto

## 1. Propósito

La aplicación agiliza los estudios técnicos que determinan si un vehículo es compatible con servicios basados en dispositivos GPS y periféricos asociados.

El MVP cubre dos estudios:

1. Compatibilidad con lecturas CANBus.
2. Compatibilidad con descarga remota de tacógrafo.

También conserva el historial de clientes, vehículos, estudios, revisiones, evidencias y decisiones.

## 2. Usuarios y evolución

Primera etapa:

- usuarios del departamento técnico;
- introducción manual de marca, modelo, año, VIN o referencia de tacógrafo;
- consulta y revisión de resultados.

Etapas posteriores:

- OCR de fichas técnicas y tickets de tacógrafo;
- OCR bajo demanda de esquemas CANBus;
- acceso del departamento comercial;
- acceso restringido de clientes;
- integración con la aplicación existente;
- optimización móvil y captura mediante cámara.

## 3. Arquitectura

Arquitectura cliente-servidor con backend monolítico modular.

```text
Ionic + Angular + Capacitor
            |
          HTTPS
            |
    API REST NestJS/Express
            |
         Sequelize
            |
           MySQL
```

Integraciones futuras mediante puertos y adaptadores:

- motor OCR;
- Redis para caché técnica, trabajos o coordinación;
- almacenamiento documental local o compatible con objetos;
- aplicación corporativa existente.

## 4. Principios

- MySQL persiste datos, relaciones y trazabilidad.
- NestJS ejecuta reglas, interpretación de identificadores y selección de documentos.
- El frontend no contiene reglas de decisión autoritativas.
- Los resultados deben indicar su procedencia: documento, regla, inferencia, excepción o revisión manual.
- Los casos ambiguos se muestran como pendientes; no se fuerzan a compatible o incompatible.
- Los estudios son históricos y ampliables.

## 5. Base de datos

Esquema MySQL: `technical_studies`.

Archivos iniciales:

- `database/technical_studies_unified.sql`: instalación completa.
- `database/migration_v2_canbus_ocr_cache.sql`: migración de la versión inicial.
- `database/unified_database_report.md`: explicación y consultas.

### Núcleo operativo

- `client`: clientes.
- `vehicle`: vehículos; matrícula normalizada única.
- `technical_study`: estudio de un cliente; puede enlazar un estudio anterior mediante `parent_study_id`.
- `study_vehicle`: vehículos incluidos en un estudio.
- `assessment`: evaluación CANBus o de tacógrafo de un vehículo.
- `assessment_revision`: historial inmutable de resultados.
- `study_event`: cronología funcional del estudio.
- `audit_event`: auditoría administrativa.
- `file_asset` y `attachment_link`: documentos e imágenes relacionados.

### CANBus

- `canbus_manufacturer`: fabricante normalizado.
- `canbus_document`: PDF disponible, nombre original, descriptor y año inicial.
- `canbus_document_part`: tokens y calificadores extraídos del nombre.
- `canbus_document_issue`: incidencias de importación.
- `canbus_parameter`: catálogo de parámetros legibles.
- `canbus_document_analysis`: versión analizada de un PDF y caché por hash.
- `canbus_document_extraction_attempt`: intentos OCR/manuales.
- `canbus_document_parameter`: parámetros disponibles en esa versión documental.
- `canbus_assessment_detail`: datos de entrada y documento seleccionado para una revisión.
- `canbus_assessment_parameter`: foto de parámetros aplicada al vehículo.

La selección del documento se hace en código. Regla general de año: elegir el esquema con mayor `start_year` que no exceda el año del vehículo, aplicando después calificadores. Los casos anteriores al primer esquema, posteriores al último sin vigencia suficiente, coincidencias anuales ambiguas o calificadores incompletos pueden requerir revisión.

### Tacógrafos

- `tachograph_manufacturer`, `tachograph_model` y `tachograph_identifier`: identidad del dispositivo.
- `tachograph_document_occurrence`: evidencia del modelo en documentos.
- `tachograph_compatibility_decision`: decisión versionada del catálogo.
- tablas de relación con documentos y reglas.
- `tachograph_assessment_detail`: resultado aplicado a una revisión concreta.

Resultados iniciales posibles:

- `CAN2_TRASERA`
- `FRONTAL_Y_CAN2`
- `SOLO_FRONTAL`
- `NO_COMPATIBLE`
- `SIN_RESULTADO`
- `NO_APLICA_ANALOGICO`

Estados como `CONFIRMADO`, `INFERIDO`, `PENDIENTE_REVISION` y `NO_APLICA` no son equivalentes y deben conservarse.

## 6. Flujo CANBus esperado

1. Recibir marca, modelo, año de fabricación y calificadores disponibles.
2. Normalizar la entrada sin perder el valor original.
3. Consultar documentos candidatos.
4. Aplicar intervalo anual y calificadores.
5. Si no hay una selección inequívoca, devolver pendiente de revisión.
6. Si existe documento, localizar el PDF y calcular su SHA-256.
7. Consultar `canbus_document_analysis` usando documento, hash y versión del extractor.
8. Reutilizar el análisis válido o iniciar OCR si no existe.
9. Obtener fecha `from`, revisión y parámetros.
10. Crear una revisión del estudio y copiar los parámetros a `canbus_assessment_parameter`.

## 7. Flujo de tacógrafo esperado

1. Recibir fabricante e identificador exacto.
2. Normalizar según fabricante.
3. Buscar una decisión documental vigente.
4. Si no existe, aplicar únicamente reglas explícitas y versionadas.
5. Marcar inferencias y resultados provisionales.
6. Conservar fuentes y reglas utilizadas.
7. Guardar el resultado como nueva revisión del estudio.

Reglas conocidas, que deben implementarse y probarse separadamente:

- En VDO, identificadores que no empiezan por `1381` se consideran analógicos dentro del contexto VDO.
- El documento VDO 2019 prevalece cuando existe evidencia en 2019 y 2023.
- Verde 2019: CAN2 trasera.
- Naranja 2019: solo conexión frontal según el criterio del proyecto.
- Rojo 2019: no compatible.
- Presencia exclusiva en VDO 2023: inferencia de CAN2 trasera, no dato documental directo.
- Stoneridge superior a 7.0: CAN2 trasera; 7.0 o inferior: no compatible salvo excepción.
- Stoneridge no ofrece descarga frontal según el criterio inicial.

## 8. Alcance inicial recomendado

Primera vertical implementable:

- infraestructura del repositorio;
- conexión segura y comprobable con MySQL;
- endpoint de salud;
- lectura del catálogo CANBus sin OCR;
- caso de uso para obtener candidatos por fabricante, modelo y año;
- pruebas unitarias e integración;
- pantalla Ionic sencilla para introducir criterios y mostrar candidatos.

No incorporar inicialmente autenticación completa, OCR real, Redis, almacenamiento en nube ni gestión pública de clientes. Preparar interfaces, pero implementar solo lo necesario para la vertical aprobada.

## 9. Criterios de calidad del TFM

- Decisiones arquitectónicas justificadas mediante ADR.
- Prompts y cambios de IA trazables.
- Revisión humana documentada.
- Pruebas reproducibles.
- Seguridad por diseño.
- Commits pequeños y comprensibles.
- Evidencia de que las reglas se verificaron contra la documentación y la base.
- Registro de errores detectados en código generado y de cómo se corrigieron.

