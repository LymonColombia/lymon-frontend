# LymonFrontend

## Arquitectura limpia

El proyecto sigue los principios de Clean Architecture para mantener el código desacoplado, testear fácilmente y escalable. A continuación se describe qué va en cada carpeta:

### `src/app/core`

Esta capa contiene la lógica de negocio pura y es independiente de cualquier framework externo o implementación de datos.

- **domain/**: Aquí residen las _Entidades_ y modelos del negocio.
- **use-cases/**: Contiene la lógica de aplicación. Cada caso de uso representa una acción específica que puede realizar el usuario (ej. `GetAllUsers`, `LoginUser`).
- **repositories/** (Interfaces): Aquí se definen los _contratos_ (interfaces abstractas) de los repositorios. La capa `core` dice _qué_ necesita, pero no _cómo_ se obtiene.

### `src/app/data`

Esta capa se encarga de la recuperación y persistencia de datos. Implementa las interfaces definidas en `core`.

- **repositories/** (Implementaciones): Implementaciones concretas de las interfaces de `core`. Aquí se realizan las llamadas HTTP o conexiones a bases de datos locales.
- **mappers/**: Funciones o clases encargadas de transformar los datos que vienen fuentes externas (DTOs) a las entidades del dominio definidas en `core`, y viceversa.

### `src/app/presentation`

Capa encargada de lo que ve el usuario. Solo debe preocuparse por mostrar datos y capturar eventos.

- **pages/**: "Smart Components" o Vistas. Son componentes que orquestan la vista, llaman a los `use-cases` y gestionan el estado de la página.
- **components/**: "Dumb Components" o componentes reutilizables. Solo reciben datos (`@Input`) y emiten eventos (`@Output`), sin depender de servicios complejos.

---

## Conventional Commits

Para mantener un historial de cambios limpio y legible, utilizamos **Conventional Commits**. Cada commit debe tener la estructura: `<tipo>: <descripción breve>`.

### Tipos de Commits permitidos:

- **feat**: Una nueva funcionalidad.
  - Ejemplo: `feat: add login page validation`
- **fix**: Corrección de un error (bug).
  - Ejemplo: `fix: resolve crash when user list is empty`
- **docs**: Cambios solo en la documentación.
  - Ejemplo: `docs: update readme with project structure`
- **style**: Cambios que no afectan el significado del código (espacios, formato, puntos y comas).
  - Ejemplo: `style: format user.service.ts`
- **refactor**: Cambio en el código que no arregla un bug ni añade una funcionalidad (mejora de estructura).
  - Ejemplo: `refactor: simplify date parsing logic`
- **test**: Añadir o corregir tests existentes.
  - Ejemplo: `test: add unit tests for date-mapper`
- **chore**: Cambios en el proceso de construcción o herramientas auxiliares y librerías.
  - Ejemplo: `chore: update angular dependencies`

---

## Reglas y Buenas Prácticas

Para asegurar la calidad del código, seguimos estas reglas estrictas:

1. **Idioma: Inglés**
   - **TODO** el código debe estar en inglés. Esto incluye nombres de variables, funciones, clases, interfaces, comentarios y mensajes de commit.
   - _Correcto_: `getUserById(id: string)`
   - _Incorrecto_: `obtenerUsuarioPorId(id: string)`

2. **Convenciones de Nombres (Naming Conventions)**
   - **Clases e Interfaces**: Usar `PascalCase`. (Ej. `UserLogin`, `ProductRepository`).
   - **Variables y Funciones**: Usar `camelCase`. (Ej. `isLoading`, `calculateTotal()`).
   - **Constantes Globales**: Usar `UPPER_SNAKE_CASE`. (Ej. `MAX_RETRY_COUNT`).

3. **Responsabilidad Única (Single Responsibility Principle - SRP)**
   - Cada archivo, clase o función debe tener una única responsabilidad.
   - Si un componente está haciendo demasiadas cosas (ej. llamando a la API, validando formularios y calculando fechas), divide la lógica en servicios, utilidades o componentes más pequeños.
