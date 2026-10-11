# Admisiones UNAC · Backend

API REST del sistema de admisiones de la UNAC. Gestiona el proceso completo del aspirante (pre-inscripción → documentos → entrevistas → decisión → matrícula), la autenticación por roles del panel administrativo y la integración con n8n y WhatsApp.

> Forma parte de tres proyectos: **back** (este), **[front](../front/README.md)** y **[n8n](../n8n/README.md)** (automatizaciones).

## Stack

|               |                                                         |
| ------------- | ------------------------------------------------------- |
| Runtime       | [Bun](https://bun.sh) (desarrollo) · Node compatible    |
| Framework     | Express 5                                               |
| Base de datos | PostgreSQL (Supabase) con Prisma 7                      |
| Validación    | Zod                                                     |
| Autenticación | JWT en cookie `httpOnly` + bcrypt                       |
| Integraciones | n8n (agente IA con DeepSeek) · Evolution API (WhatsApp) |

## Puesta en marcha

```bash
bun install
cp .env.example .env          # y completa los valores
bunx prisma migrate deploy    # aplica las migraciones
bunx prisma generate          # genera el cliente en ./generated/prisma
bun run db:seederuser         # crea/actualiza el administrador inicial
bun run dev                   # http://localhost:3000
```

Comprueba que responde en `GET /health`.

### Scripts

| Script                  | Qué hace                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `bun run dev`           | Servidor con recarga automática (`bun --watch`)                                              |
| `bun run start`         | Servidor con `tsx watch` (alternativa en Node)                                               |
| `bun run build`         | Compila a `dist/`                                                                            |
| `bun run format`        | Formatea con Prettier                                                                        |
| `bun run db:seederuser` | Crea el usuario `ADMIN_CORREO` con `ADMIN_PASSWORD` (o le asigna la contraseña si ya existe) |

## Variables de entorno

| Variable                          | Descripción                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PORT`                            | Puerto del servidor (por defecto `3000`)                                                                |
| `DATABASE_URL`                    | Conexión a PostgreSQL usada por la app (pooler)                                                         |
| `DIRECT_URL`                      | Conexión directa usada por las migraciones de Prisma                                                    |
| `JWT_SECRET`                      | Secreto para firmar las sesiones. Usa uno largo y aleatorio                                             |
| `ADMIN_CORREO` / `ADMIN_PASSWORD` | Administrador inicial para `db:seederuser`. La contraseña necesita 8+ caracteres, una letra y un número |
| `N8N_WEBHOOK_ENTREVISTA_URL`      | Webhook de n8n que avisa por WhatsApp cuando se programa o edita una entrevista                         |
| `N8N_WEBHOOK_CHAT_URL`            | Webhook de n8n del chat de la landing                                                                   |
| `CHAT_TOOLS_TOKEN`                | Token compartido con n8n para las herramientas del agente (header `x-chat-token`)                       |
| `EVOLUTION_API_URL`               | URL de Evolution API, p. ej. `http://localhost:8080`                                                    |
| `EVOLUTION_API_KEY`               | API key global de Evolution API                                                                         |
| `EVOLUTION_INSTANCE`              | Nombre de la instancia de WhatsApp (p. ej. `test`)                                                      |

> Si una variable de n8n o Evolution no está definida, esa integración simplemente no se ejecuta: el resto del sistema sigue funcionando.

## Estructura

```
src/
├── app.ts            # Express: CORS, cookies, registro de rutas y qué es público/protegido
├── index.ts          # Arranque del servidor
├── routes/           # Endpoints por módulo (+ requireRole por acción)
├── controllers/      # Validación con Zod y respuesta HTTP
├── models/           # Servicios con la lógica de negocio (Prisma)
├── domain/           # Esquemas Zod y DTOs por módulo
├── middlewares/      # requireAuth / requireRole
├── db/               # Cliente de Prisma
└── infrastructure/   # Seeders
prisma/
├── schema.prisma     # Modelo de datos
└── migrations/       # Migraciones (aplicar con `prisma migrate deploy`)
```

## Modelo de datos

Basado en el BPMN del proceso de admisión:

| Modelo                                         | Para qué                                                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Aspirante`                                    | Persona que se postula (documento, correo, teléfono…)                                                                |
| `ProgramaAcademico`                            | Oferta académica; `activo=false` es la eliminación lógica                                                            |
| `Solicitud`                                    | Postulación de un aspirante a un programa. Su `estado` recorre las etapas del proceso y guarda la fecha de cada hito |
| `Documento`                                    | Documentos exigidos (identidad, foto, bachiller, ICFES, otro) con su estado de validación                            |
| `ObservacionAdmisiones`                        | Observaciones que Admisiones le hace al aspirante (paso 4b)                                                          |
| `Entrevista`                                   | Entrevistas de Capellanía y Académica                                                                                |
| `EvaluacionCapellania` / `EvaluacionAcademica` | Rúbricas de 5 criterios (1–5) con su promedio                                                                        |
| `DecisionAdmision`                             | Decisión de Coordinación y ratificación de Vicerrectoría                                                             |
| `Usuario`                                      | Funcionarios del panel, con su rol y contraseña                                                                      |

### Flujo de estados de la solicitud

```
FORMULARIO_COMPLETADO → PAGO_INSCRIPCION → DOCUMENTOS_CARGADOS → VALIDACION_REQUISITOS
        ↘ OBSERVADO (observación abierta) ↺ vuelve a VALIDACION_REQUISITOS al resolverla
→ ADMITIDO_PRELIMINAR → EN_ENTREVISTA_CAPELLANIA → EN_ENTREVISTA_ACADEMICA
→ Decisión de Coordinación:
     Admitir / Rechazar  → EN_RATIFICACION → (Vicerrectoría ratifica) → ADMITIDO / RECHAZADO
     Corregir perfil     → CORRECCION_PERFIL
     (Vicerrectoría no ratifica) → CORRECCION_PERFIL
→ MATRICULADO → CUENTA_ACTIVADA        (ARCHIVADO cierra la solicitud en cualquier punto)
```

Reglas automáticas:

- **Documentos:** al validar el certificado de bachiller o el ICFES se marcan `bachillerValidado` / `icfesValidado`. Cuando los 4 documentos obligatorios están validados se marca `requisitosValidados` y la `fechaValidacion`.
- **Observaciones:** registrar una pasa la solicitud a `OBSERVADO`, y resolver la última abierta la regresa a `VALIDACION_REQUISITOS`.
- **Decisiones:** una solicitud no puede tener dos decisiones pendientes. Una decisión ya revisada por Vicerrectoría no se edita ni se elimina.

## Autenticación y roles

- **Iniciar sesión:** `POST /api/auth/login` deja una cookie `httpOnly` (`admisiones_token`) válida por **8 horas**. También se acepta `Authorization: Bearer <token>`.
- **Validación en cada petición:** `requireAuth` vuelve a consultar el usuario, así que desactivarlo o cambiarle el rol tiene efecto inmediato.
- **Límite de intentos:** 10 intentos de login cada 15 minutos por IP.
- **Sin contraseña no hay acceso:** un usuario sin contraseña existe pero no puede entrar. El administrador se la asigna desde _Usuarios_.

Cualquier usuario con sesión puede **leer** todos los módulos. Para **escribir** hace falta uno de estos roles (`ADMIN` puede todo):

| Acción                                           | Roles                                                    |
| ------------------------------------------------ | -------------------------------------------------------- |
| Programas, aspirantes, documentos, observaciones | `ADMISIONES`                                             |
| Solicitudes                                      | `ADMISIONES`, `OFICINA_FINANCIERA`, `REGISTRO_ACADEMICO` |
| Programar / editar entrevistas                   | `ADMISIONES`, `CAPELLAN`, `COORDINADOR_PROGRAMA`         |
| Evaluar entrevistas                              | `CAPELLAN`, `COORDINADOR_PROGRAMA`                       |
| Tomar decisiones de admisión                     | `COORDINADOR_PROGRAMA`                                   |
| Ratificar decisiones                             | `VICERRECTORIA`                                          |
| Gestionar usuarios                               | `ADMIN`                                                  |

## Endpoints

### Públicos (sin sesión)

| Método         | Ruta                                   | Descripción                                                                                         |
| -------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET`          | `/health`                              | Estado del servidor                                                                                 |
| `POST`         | `/api/auth/login` · `/api/auth/logout` | Iniciar / cerrar sesión                                                                             |
| `GET`          | `/api/programas`                       | Programas (los usa la landing)                                                                      |
| `POST`         | `/api/public/preinscripcion`           | Formulario de la landing: crea o reutiliza el aspirante y abre su solicitud                         |
| `POST`         | `/api/chat`                            | Chat de la landing (reenvía al agente de n8n). Límite de 20 mensajes/min por IP                     |
| `GET` · `POST` | `/api/chat/tools/*`                    | Herramientas del agente: `programas`, `preinscripcion`, `whatsapp`. Exigen el header `x-chat-token` |

### Con sesión

| Recurso       | Rutas                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Sesión        | `GET /api/auth/me` · `PUT /api/auth/password`                                          |
| Dashboard     | `GET /api/dashboard/{kpis,funnel,conversion,programas,actividad,alerts,trends,export}` |
| Programas     | `POST /api/programas` · `PUT /:id` · `PATCH /:id/estado`                               |
| Aspirantes    | `GET/POST /aspirantes` · `GET/PUT /aspirantes/:id`                                     |
| Solicitudes   | `GET/POST /api/solicitudes` · `GET/PUT /:id` · `PATCH /:id/estado`                     |
| Documentos    | `GET/POST /api/documentos` · `PUT /:id` · `PATCH /:id/estado` · `DELETE /:id`          |
| Observaciones | `GET/POST /api/observaciones` · `PUT /:id` · `PATCH /:id/resolver` · `DELETE /:id`     |
| Entrevistas   | `GET/POST /api/entrevistas` · `GET/PUT/DELETE /:id` · `POST /:id/evaluacion`           |
| Decisiones    | `GET/POST /api/decisiones` · `PUT /:id` · `PATCH /:id/ratificacion` · `DELETE /:id`    |
| Usuarios      | `GET/POST /api/usuarios` · `GET/PUT/DELETE /:id` (`DELETE` desactiva)                  |

Todas las respuestas tienen la forma `{ success, data?, message? }`.

## Integraciones

- **Aviso de entrevistas:** al crear o editar una entrevista, `notificacion.service` envía los datos a `N8N_WEBHOOK_ENTREVISTA_URL`. n8n redacta el mensaje con DeepSeek y lo envía por WhatsApp. Se hace en segundo plano y nunca bloquea el guardado.
- **Chat de la landing:** `/api/chat` reenvía cada mensaje a n8n. El agente usa las herramientas `/api/chat/tools/*` para consultar programas, pre-inscribir y enviar WhatsApp.
- **WhatsApp directo:** `whatsapp.service` envía textos con Evolution API (por ejemplo, el aviso de una observación). Normaliza los celulares colombianos de 10 dígitos agregando el `57`.

## Migraciones en Supabase

Supabase no permite la _shadow database_ que usa `prisma migrate dev`. Para cambiar el esquema:

1. Edita `prisma/schema.prisma`.
2. Crea `prisma/migrations/<timestamp>_<nombre>/migration.sql` con el SQL del cambio.
3. Aplícalo con `bunx prisma migrate deploy` y luego `bunx prisma generate`.
