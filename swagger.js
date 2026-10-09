// Genera swagger-output.json a partir de los comentarios #swagger de app.js
// Uso: npm run swagger
const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

const doc = {
  info: {
    title: "Mini Pokédex API",
    version: "1.0.0",
    description:
      "API del TP05 (Abreu, Kampel). Consulta Pokémon y tipos a través de la PokeAPI " +
      "(https://pokeapi.co/api/v2) y permite armar un equipo Pokémon propio (máximo 6 integrantes).\n\n" +
      "Las operaciones que modifican el equipo (POST, PUT, DELETE) requieren el header `x-api-key`. " +
      "Para probarlas, tocar **Authorize** e ingresar la clave `pokedex123`.",
  },
  servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
  tags: [
    { name: "Pokémon", description: "Consulta de Pokémon (datos obtenidos de la PokeAPI)" },
    { name: "Tipos", description: "Consulta de tipos de Pokémon (datos obtenidos de la PokeAPI)" },
    { name: "Equipo", description: "CRUD del equipo Pokémon del usuario (guardado en memoria)" },
  ],
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Clave para operaciones de escritura. Valor: pokedex123",
      },
    },
    "@schemas": {
      Pokemon: {
        type: "object",
        description: "Pokémon simplificado a partir de la respuesta de la PokeAPI",
        properties: {
          id: { type: "integer", description: "Número de Pokédex nacional", example: 25 },
          nombre: { type: "string", description: "Nombre del Pokémon en minúsculas", example: "pikachu" },
          imagen: {
            type: "string",
            format: "uri",
            nullable: true,
            description: "URL del sprite frontal",
            example: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
          },
          tipos: {
            type: "array",
            description: "Tipos del Pokémon",
            items: { type: "string" },
            example: ["electric"],
          },
          peso: { type: "integer", description: "Peso en hectogramos (60 = 6 kg)", example: 60 },
          altura: { type: "integer", description: "Altura en decímetros (4 = 0,4 m)", example: 4 },
        },
      },
      ResumenPokemon: {
        type: "object",
        description: "Elemento del listado paginado",
        properties: {
          id: { type: "integer", description: "Número de Pokédex nacional", example: 1 },
          nombre: { type: "string", description: "Nombre del Pokémon", example: "bulbasaur" },
          url: {
            type: "string",
            format: "uri",
            description: "URL del detalle en esta API",
            example: "http://localhost:3000/api/pokemon/1",
          },
        },
      },
      ListaPokemon: {
        type: "object",
        description: "Listado paginado de Pokémon",
        properties: {
          total: { type: "integer", description: "Cantidad total de Pokémon existentes", example: 1351 },
          limit: { type: "integer", description: "Cantidad pedida por página", example: 5 },
          offset: { type: "integer", description: "Posición desde la que se empezó a listar", example: 0 },
          resultados: { type: "array", items: { $ref: "#/components/schemas/ResumenPokemon" } },
        },
      },
      Tipo: {
        type: "object",
        description: "Tipo de Pokémon con sus relaciones de daño",
        properties: {
          id: { type: "integer", description: "Identificador del tipo", example: 1 },
          nombre: { type: "string", description: "Nombre del tipo", example: "normal" },
          debilContra: {
            type: "array",
            items: { type: "string" },
            description: "Tipos que le hacen doble daño",
            example: ["fighting"],
          },
          fuerteContra: {
            type: "array",
            items: { type: "string" },
            description: "Tipos a los que les hace doble daño",
            example: [],
          },
          cantidadPokemon: {
            type: "integer",
            description: "Cantidad de Pokémon que tienen este tipo",
            example: 130,
          },
        },
      },
      MiembroEquipo: {
        type: "object",
        description: "Integrante del equipo Pokémon del usuario",
        properties: {
          id: { type: "integer", description: "Identificador del integrante dentro del equipo", example: 1 },
          pokemonId: { type: "integer", description: "Número de Pokédex del Pokémon", example: 25 },
          nombre: { type: "string", description: "Nombre de la especie", example: "pikachu" },
          apodo: { type: "string", description: "Apodo elegido por el usuario", example: "Pika" },
          nivel: { type: "integer", minimum: 1, maximum: 100, description: "Nivel (1 a 100)", example: 15 },
          imagen: {
            type: "string",
            format: "uri",
            nullable: true,
            description: "URL del sprite frontal",
            example: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
          },
        },
      },
      NuevoMiembro: {
        type: "object",
        description: "Datos para agregar un Pokémon al equipo",
        required: ["pokemon"],
        properties: {
          pokemon: {
            type: "string",
            description: "Nombre o número de Pokédex del Pokémon (se valida contra la PokeAPI)",
            example: "pikachu",
          },
          apodo: {
            type: "string",
            description: "Apodo. Si no se envía se usa el nombre del Pokémon",
            example: "Pika",
          },
          nivel: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Nivel inicial. Por defecto 5",
            example: 15,
          },
        },
      },
      ModificarMiembro: {
        type: "object",
        description: "Campos modificables de un integrante (al menos uno)",
        properties: {
          apodo: { type: "string", description: "Nuevo apodo", example: "Chispita" },
          nivel: { type: "integer", minimum: 1, maximum: 100, description: "Nuevo nivel", example: 30 },
        },
      },
      Error: {
        type: "object",
        description: "Formato común de los errores de la API",
        properties: {
          error: { type: "string", description: "Mensaje que explica el error", example: "Pokémon no encontrado" },
        },
      },
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, doc);
