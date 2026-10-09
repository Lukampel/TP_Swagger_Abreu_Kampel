const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

const app = express();
const PORT = process.env.PORT || 3000;
const POKEAPI = "https://pokeapi.co/api/v2";
const API_KEY = "pokedex123";
const MAX_EQUIPO = 6;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile, {
  swaggerOptions: { defaultModelExpandDepth: 3 },
}));

// ---------- Helpers ----------

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function pedirPokeApi(ruta, mensaje404) {
  let res;
  try {
    res = await fetch(`${POKEAPI}${ruta}`);
  } catch {
    throw new HttpError(502, "No se pudo conectar con la PokeAPI");
  }
  if (res.status === 404) throw new HttpError(404, mensaje404);
  if (!res.ok) throw new HttpError(502, `La PokeAPI respondió con estado ${res.status}`);
  return res.json();
}

function simplificarPokemon(data) {
  return {
    id: data.id,
    nombre: data.name,
    imagen: data.sprites.front_default,
    tipos: data.types.map((t) => t.type.name),
    peso: data.weight,
    altura: data.height,
  };
}

function esEnteroEntre(valor, min, max) {
  return Number.isInteger(valor) && valor >= min && valor <= max;
}

function requiereApiKey(req, res, next) {
  if (req.get("x-api-key") !== API_KEY) {
    return res.status(401).json({ error: "Falta el header x-api-key o la clave es incorrecta" });
  }
  next();
}

// ---------- Pokémon (PokeAPI) ----------

app.get("/api/pokemon", async (req, res) => {
  /* #swagger.tags = ['Pokémon']
     #swagger.summary = 'Lista Pokémon de forma paginada'
     #swagger.description = 'Devuelve un listado paginado de Pokémon obtenido de la PokeAPI.'
     #swagger.parameters['limit'] = {
       in: 'query', description: 'Cantidad de resultados (1 a 100). Por defecto 20',
       required: false, '@schema': { type: 'integer', minimum: 1, maximum: 100, default: 20 }, example: 5
     }
     #swagger.parameters['offset'] = {
       in: 'query', description: 'Cantidad de resultados a saltear. Por defecto 0',
       required: false, '@schema': { type: 'integer', minimum: 0, default: 0 }, example: 0
     }
     #swagger.responses[200] = {
       description: 'Listado obtenido correctamente',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/ListaPokemon' } } }
     }
     #swagger.responses[400] = {
       description: 'limit u offset inválidos',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'limit debe ser un entero entre 1 y 100' } } }
     }
     #swagger.responses[502] = {
       description: 'No se pudo obtener la información de la PokeAPI',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'No se pudo conectar con la PokeAPI' } } }
     }
  */
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);

  if (!esEnteroEntre(limit, 1, 100)) {
    return res.status(400).json({ error: "limit debe ser un entero entre 1 y 100" });
  }
  if (!esEnteroEntre(offset, 0, Number.MAX_SAFE_INTEGER)) {
    return res.status(400).json({ error: "offset debe ser un entero mayor o igual a 0" });
  }

  const data = await pedirPokeApi(`/pokemon?limit=${limit}&offset=${offset}`, "No hay resultados");
  const base = `${req.protocol}://${req.get("host")}/api/pokemon`;

  res.status(200).json({
    total: data.count,
    limit,
    offset,
    resultados: data.results.map((p) => {
      const id = Number(p.url.split("/").filter(Boolean).pop());
      return { id, nombre: p.name, url: `${base}/${id}` };
    }),
  });
});

app.get("/api/pokemon/:nombreOId", async (req, res) => {
  /* #swagger.tags = ['Pokémon']
     #swagger.summary = 'Obtiene un Pokémon por nombre o número'
     #swagger.description = 'Busca un Pokémon en la PokeAPI y devuelve su imagen, tipos, peso y altura. Es el endpoint que usa la Mini Pokédex.'
     #swagger.parameters['nombreOId'] = {
       in: 'path', description: 'Nombre (no distingue mayúsculas) o número de Pokédex', required: true,
       schema: { type: 'string' }, example: 'pikachu'
     }
     #swagger.responses[200] = {
       description: 'Pokémon encontrado',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Pokemon' } } }
     }
     #swagger.responses[404] = {
       description: 'No existe un Pokémon con ese nombre o número',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'Pokémon no encontrado' } } }
     }
     #swagger.responses[502] = {
       description: 'No se pudo obtener la información de la PokeAPI',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'No se pudo conectar con la PokeAPI' } } }
     }
  */
  const valor = encodeURIComponent(req.params.nombreOId.toLowerCase().trim());
  const data = await pedirPokeApi(`/pokemon/${valor}`, "Pokémon no encontrado");
  res.status(200).json(simplificarPokemon(data));
});

// ---------- Tipos (PokeAPI) ----------

app.get("/api/tipos/:nombreOId", async (req, res) => {
  /* #swagger.tags = ['Tipos']
     #swagger.summary = 'Obtiene un tipo de Pokémon'
     #swagger.description = 'Devuelve un tipo con sus debilidades, fortalezas y la cantidad de Pokémon que lo tienen.'
     #swagger.parameters['nombreOId'] = {
       in: 'path', description: 'Nombre (ej: fire) o número del tipo (ej: 1)', required: true,
       schema: { type: 'string' }, example: 'fire'
     }
     #swagger.responses[200] = {
       description: 'Tipo encontrado',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Tipo' } } }
     }
     #swagger.responses[404] = {
       description: 'No existe ese tipo',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'Tipo no encontrado' } } }
     }
     #swagger.responses[502] = {
       description: 'No se pudo obtener la información de la PokeAPI',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'No se pudo conectar con la PokeAPI' } } }
     }
  */
  const valor = encodeURIComponent(req.params.nombreOId.toLowerCase().trim());
  const data = await pedirPokeApi(`/type/${valor}`, "Tipo no encontrado");
  res.status(200).json({
    id: data.id,
    nombre: data.name,
    debilContra: data.damage_relations.double_damage_from.map((t) => t.name),
    fuerteContra: data.damage_relations.double_damage_to.map((t) => t.name),
    cantidadPokemon: data.pokemon.length,
  });
});

// ---------- Equipo (CRUD propio, en memoria) ----------

let equipo = [];
let siguienteId = 1;

function buscarMiembro(idTexto) {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "El id debe ser un entero positivo");
  const miembro = equipo.find((m) => m.id === id);
  if (!miembro) throw new HttpError(404, `No hay ningún integrante con id ${id}`);
  return miembro;
}

app.get("/api/equipo", (req, res) => {
  /* #swagger.tags = ['Equipo']
     #swagger.summary = 'Lista el equipo'
     #swagger.description = 'Devuelve todos los integrantes del equipo (máximo 6).'
     #swagger.responses[200] = {
       description: 'Equipo actual (puede ser una lista vacía)',
       content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MiembroEquipo' } } } }
     }
  */
  res.status(200).json(equipo);
});

app.get("/api/equipo/:id", (req, res) => {
  /* #swagger.tags = ['Equipo']
     #swagger.summary = 'Obtiene un integrante del equipo'
     #swagger.parameters['id'] = {
       in: 'path', description: 'Id del integrante', required: true, schema: { type: 'integer' }, example: 1
     }
     #swagger.responses[200] = {
       description: 'Integrante encontrado',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/MiembroEquipo' } } }
     }
     #swagger.responses[400] = {
       description: 'El id no es un entero positivo',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'El id debe ser un entero positivo' } } }
     }
     #swagger.responses[404] = {
       description: 'No existe un integrante con ese id',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'No hay ningún integrante con id 1' } } }
     }
  */
  res.status(200).json(buscarMiembro(req.params.id));
});

app.post("/api/equipo", requiereApiKey, async (req, res) => {
  /* #swagger.tags = ['Equipo']
     #swagger.summary = 'Agrega un Pokémon al equipo'
     #swagger.description = 'Valida que el Pokémon exista en la PokeAPI y lo agrega al equipo. El equipo admite como máximo 6 integrantes.'
     #swagger.security = [{ apiKeyAuth: [] }]
     #swagger.requestBody = {
       required: true,
       content: { 'application/json': { schema: { $ref: '#/components/schemas/NuevoMiembro' },
         example: { pokemon: 'pikachu', apodo: 'Pika', nivel: 15 } } }
     }
     #swagger.responses[201] = {
       description: 'Integrante agregado',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/MiembroEquipo' } } }
     }
     #swagger.responses[400] = {
       description: 'Body inválido o el equipo ya tiene 6 integrantes',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         examples: {
           faltaPokemon: { summary: 'Falta el campo pokemon', value: { error: 'El campo pokemon es obligatorio' } },
           nivelInvalido: { summary: 'Nivel fuera de rango', value: { error: 'nivel debe ser un entero entre 1 y 100' } },
           equipoLleno: { summary: 'Equipo completo', value: { error: 'El equipo ya tiene 6 integrantes' } }
         } } }
     }
     #swagger.responses[401] = {
       description: 'Falta la API key o es incorrecta',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'Falta el header x-api-key o la clave es incorrecta' } } }
     }
     #swagger.responses[404] = {
       description: 'El Pokémon indicado no existe',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'Pokémon no encontrado' } } }
     }
     #swagger.responses[502] = {
       description: 'No se pudo validar el Pokémon contra la PokeAPI',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'No se pudo conectar con la PokeAPI' } } }
     }
  */
  const { pokemon, apodo, nivel = 5 } = req.body ?? {};

  if (pokemon === undefined || String(pokemon).trim() === "") {
    return res.status(400).json({ error: "El campo pokemon es obligatorio" });
  }
  if (apodo !== undefined && typeof apodo !== "string") {
    return res.status(400).json({ error: "apodo debe ser un texto" });
  }
  if (!esEnteroEntre(nivel, 1, 100)) {
    return res.status(400).json({ error: "nivel debe ser un entero entre 1 y 100" });
  }
  if (equipo.length >= MAX_EQUIPO) {
    return res.status(400).json({ error: `El equipo ya tiene ${MAX_EQUIPO} integrantes` });
  }

  const valor = encodeURIComponent(String(pokemon).toLowerCase().trim());
  const data = simplificarPokemon(await pedirPokeApi(`/pokemon/${valor}`, "Pokémon no encontrado"));

  const miembro = {
    id: siguienteId++,
    pokemonId: data.id,
    nombre: data.nombre,
    apodo: apodo?.trim() || data.nombre,
    nivel,
    imagen: data.imagen,
  };
  equipo.push(miembro);
  res.status(201).json(miembro);
});

app.put("/api/equipo/:id", requiereApiKey, (req, res) => {
  /* #swagger.tags = ['Equipo']
     #swagger.summary = 'Modifica el apodo y/o nivel de un integrante'
     #swagger.security = [{ apiKeyAuth: [] }]
     #swagger.parameters['id'] = {
       in: 'path', description: 'Id del integrante', required: true, schema: { type: 'integer' }, example: 1
     }
     #swagger.requestBody = {
       required: true,
       content: { 'application/json': { schema: { $ref: '#/components/schemas/ModificarMiembro' },
         example: { apodo: 'Chispita', nivel: 30 } } }
     }
     #swagger.responses[200] = {
       description: 'Integrante modificado',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/MiembroEquipo' } } }
     }
     #swagger.responses[400] = {
       description: 'Id inválido o body sin campos válidos',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'Enviá al menos apodo o nivel' } } }
     }
     #swagger.responses[401] = {
       description: 'Falta la API key o es incorrecta',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'Falta el header x-api-key o la clave es incorrecta' } } }
     }
     #swagger.responses[404] = {
       description: 'No existe un integrante con ese id',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'No hay ningún integrante con id 1' } } }
     }
  */
  const miembro = buscarMiembro(req.params.id);
  const { apodo, nivel } = req.body ?? {};

  if (apodo === undefined && nivel === undefined) {
    return res.status(400).json({ error: "Enviá al menos apodo o nivel" });
  }
  if (apodo !== undefined && (typeof apodo !== "string" || apodo.trim() === "")) {
    return res.status(400).json({ error: "apodo debe ser un texto no vacío" });
  }
  if (nivel !== undefined && !esEnteroEntre(nivel, 1, 100)) {
    return res.status(400).json({ error: "nivel debe ser un entero entre 1 y 100" });
  }

  if (apodo !== undefined) miembro.apodo = apodo.trim();
  if (nivel !== undefined) miembro.nivel = nivel;
  res.status(200).json(miembro);
});

app.delete("/api/equipo/:id", requiereApiKey, (req, res) => {
  /* #swagger.tags = ['Equipo']
     #swagger.summary = 'Quita un integrante del equipo'
     #swagger.security = [{ apiKeyAuth: [] }]
     #swagger.parameters['id'] = {
       in: 'path', description: 'Id del integrante', required: true, schema: { type: 'integer' }, example: 1
     }
     #swagger.responses[200] = {
       description: 'Integrante eliminado. Devuelve el integrante que se quitó',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/MiembroEquipo' } } }
     }
     #swagger.responses[400] = {
       description: 'El id no es un entero positivo',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'El id debe ser un entero positivo' } } }
     }
     #swagger.responses[401] = {
       description: 'Falta la API key o es incorrecta',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'Falta el header x-api-key o la clave es incorrecta' } } }
     }
     #swagger.responses[404] = {
       description: 'No existe un integrante con ese id',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' },
         example: { error: 'No hay ningún integrante con id 1' } } }
     }
  */
  const miembro = buscarMiembro(req.params.id);
  equipo = equipo.filter((m) => m !== miembro);
  res.status(200).json(miembro);
});

// ---------- Manejo de errores ----------

app.use("/api", (req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El body no es un JSON válido" });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: "Solicitud inválida" });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Mini Pokédex en http://localhost:${PORT}`);
  console.log(`Swagger UI en http://localhost:${PORT}/api-docs`);
});
