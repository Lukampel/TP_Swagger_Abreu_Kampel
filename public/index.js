const input = document.getElementById("pokemonInput");
const boton = document.getElementById("search");

const loading = document.getElementById("loading");
const error = document.getElementById("error");

const nameEl = document.getElementById("name");
const imgEl = document.getElementById("sprite");
const typeEl = document.getElementById("type");
const weightEl = document.getElementById("weight");
const heightEl = document.getElementById("height");

boton.addEventListener("click", getPokemon);

async function getPokemon() {
    const value = input.value.toLowerCase().trim(); 

    if (!value) {
        error.textContent = "Escribí un Pokémon";
        return;
    }

    error.textContent = "";
    loading.style.display = "block"; 

    try {
        const res = await fetch(`/api/pokemon/${encodeURIComponent(value)}`);

        if (!res.ok) {
            throw new Error("Pokémon no encontrado");
        }

        const data = await res.json();


        nameEl.textContent = data.nombre;
        imgEl.src = data.imagen;

        typeEl.textContent = data.tipos.join(", ");
        weightEl.textContent = data.peso;
        heightEl.textContent = data.altura;

    } catch (err) {
        error.textContent = err.message;
        nameEl.textContent = "";
        imgEl.src = "";
        typeEl.textContent = "";
        weightEl.textContent = "";
        heightEl.textContent = "";
    } finally {
        loading.style.display = "none";
    }
}