# Registro de desarrollo asistido por IA

## 2026-08-19 — Primera vertical CANBus

- Error detectado durante la validación humana: la consulta Sequelize intentaba ordenar una relación incluida usando directamente la clase del modelo. La compilación y las pruebas con dobles no detectaron el problema, pero la prueba contra MySQL produjo `Unable to find a valid association for model`.
- Corrección: el orden documental permanece en SQL y los tokens de cada documento se ordenan por `token_position` después de la lectura. No se modifica ni sincroniza el esquema.
- Prevención: mantener la prueba de integración MySQL como parte obligatoria del cierre de las verticales de persistencia.
- Validación adicional: los cuatro modelos iniciales se comparan con `information_schema` para verificar columnas, tipos, nulabilidad, claves, índices, colación sensible a mayúsculas y reglas de borrado. `import_batch_id` permanece como campo escalar por decisión aprobada, sin ampliar el módulo con un quinto modelo.

## 2026-08-19 — Selección funcional de candidatos CANBus

- Los casos tabulares de año, VIN, propulsión, mercado, descriptor y ambigüedad fueron revisados y aprobados antes de implementar las reglas.
- El contrato sustituye `RECOMMENDED` por `MATCHED` y solo devuelve `selectedDocument` cuando la decisión documental es inequívoca. `MATCHED` no equivale a compatibilidad confirmada.
- La selección toma el mayor `start_year` que no supera el año del vehículo. Los años anteriores al primer documento quedan sin cobertura y los posteriores al último requieren revisión porque el esquema no contiene una fecha final de vigencia.
- `Sport` se interpreta como parte del descriptor existente. VIN, propulsión, mercado y sistema de acceso se comparan mediante los calificadores semánticos importados; no se añadieron columnas ni reglas a la base de datos.
- Los estados de importación distintos de `OK`, los calificadores ausentes o no clasificados y las coincidencias múltiples bloquean la selección automática.
- La vertical continúa siendo de solo lectura y no ejecuta OCR, Redis ni persistencia de estudios.
