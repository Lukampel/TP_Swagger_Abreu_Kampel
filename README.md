# Mini Pokédex – TP05 DAI (Abreu, Kampel)

Página donde se ingresa el nombre o ID de un Pokémon y se muestra su imagen, peso, altura y tipo. Si no se encuentra, se avisa del error.

El proyecto tiene un servidor Express que consume la [PokeAPI](https://pokeapi.co) y administra un equipo Pokémon. La API está documentada con Swagger.

## Cómo ejecutarlo

Requiere Node.js 22.15 o superior.

```bash
npm install
npm start
```

- Mini Pokédex: http://localhost:3000
- **Documentación Swagger: http://localhost:3000/api-docs**

Para probar POST, PUT y DELETE en Swagger, tocar **Authorize** e ingresar la clave `pokedex123`.

`npm start` regenera `swagger-output.json` (con `swagger-autogen`) antes de levantar el servidor. Para regenerarlo solo: `npm run swagger`.

## Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/pokemon?limit=&offset=` | Lista Pokémon paginados |
| GET | `/api/pokemon/{nombreOId}` | Obtiene un Pokémon |
| GET | `/api/tipos/{nombreOId}` | Obtiene un tipo |
| GET | `/api/equipo` | Lista el equipo |
| GET | `/api/equipo/{id}` | Obtiene un integrante |
| POST | `/api/equipo` | Agrega un Pokémon al equipo |
| PUT | `/api/equipo/{id}` | Modifica apodo/nivel |
| DELETE | `/api/equipo/{id}` | Quita un integrante |

La documentación completa del trabajo está en [Documentacion/Documentacion_Swagger.md](Documentacion/Documentacion_Swagger.md).

## Postman

Primero había una estructura medio hecha apenas entrar a la pagina, asi que el nombre lo sacamos al toque. el id cambió el nombre por un número cualquiera, el límite estaba especificado en la web, el tipo lo mismo, y el error puse type pokemon (claramente no existe).

todos devuelven un status code 200, salvo el error intencional que devuelve 404, el error pone not found.
