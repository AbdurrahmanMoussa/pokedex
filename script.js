const apiUrl = "https://pokeapi.co/api/v2/pokemon/";
const $mainContainer = document.querySelector(".pokedex-container");
const $loadButton = document.querySelector(".load-button");
const $ulElement = document.querySelector(".list");
const $pokemonDetailsSection = document.querySelector(".pokemon-details");
let nextUrl = null;
const $dialog = document.getElementById("dialog");
const $close = document.getElementById("close");
const $caught = document.getElementById("caught");
const $release = document.getElementById("release");
let currentPokemonName = null;
const displayPokemonList = async (pokemonList) => {
  for (pokemon of pokemonList) {
    const $pokemonContainer = document.createElement("section");
    $pokemonContainer.classList.add("pokemon-container");
    const $spanElement = document.createElement("span");
    const $liElement = document.createElement("li");
    $liElement.classList.add("list-item");
    const fetchPokemon = await fetchPokemonDetails(pokemon.name);
    const spriteUrl = fetchPokemon.sprite;
    const name = fetchPokemon.name;
    const moves = fetchPokemon.moves.slice(0, 4).join(", ");
    const types = fetchPokemon.types.join(", ");

    $liElement.setAttribute("data-name", name);
    $liElement.setAttribute("data-sprite", spriteUrl);
    $liElement.setAttribute("data-moves", moves);
    $liElement.setAttribute("data-types", types);

    const $imgElement = document.createElement("img");
    $imgElement.src = spriteUrl;
    $imgElement.classList.add("sprite-img");
    $imgElement.alt = pokemon.name;

    $spanElement.textContent = pokemon.name;
    $spanElement.classList.add("pokemon-name-span");
    $liElement.append($spanElement, $imgElement);
    $ulElement.append($liElement);
    loadCurrentStyles(name);
  }
};

const fetchPokemonList = async () => {
  try {
    const response = await fetch(`${apiUrl}?limit=20`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    nextUrl = data.next;
    displayPokemonList(data.results);
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
};
const fetchPokemonDetails = async (pokemonName) => {
  const url = `${apiUrl}${pokemonName}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch Pokémon details!");

    const data = await response.json();

    const name = data.name;
    const types = data.types.map((typeInfo) => typeInfo.type.name);
    const moves = data.moves.map((moveInfo) => moveInfo.move.name);
    const sprite = data.sprites?.other?.["official-artwork"]?.front_default;
    const id = data.id;

    return { name, types, moves, sprite, id, url };
  } catch (error) {
    console.error("Error:", error);
  }
};

const loadNext = async () => {
  try {
    const response = await fetch(nextUrl);
    const data = await response.json();
    nextUrl = data.next;
    displayPokemonList(data.results);
  } catch (error) {
    console.log("error loading next 20 pokemon: ", error);
  }
};

const loadModal = (pokemon) => {
  currentPokemonName = pokemon.dataset.name;

  const name = pokemon.dataset.name;
  const sprite = pokemon.dataset.sprite;
  const types = pokemon.dataset.types;
  const moves = pokemon.dataset.moves;

  const $h1 = document.querySelector(".pokemon-name");
  $h1.textContent = name;

  const $spriteImg = document.getElementById("dialog-pokemon-sprite");
  $spriteImg.src = sprite;

  const $spanTypes = document.getElementById("types");
  $spanTypes.textContent = types;

  const $spanMoves = document.getElementById("moves");
  $spanMoves.textContent = moves;

  updateCatchReleaseButtons();
};

const updateCatchReleaseButtons = () => {
  const caughtPokemons =
    JSON.parse(localStorage.getItem("caughtPokemons")) || [];

  if (caughtPokemons.includes(currentPokemonName)) {
    $caught.style.display = "none";
    $release.style.display = "block";
  } else {
    $caught.style.display = "block";
    $release.style.display = "none";
  }
};
const catchPokemon = () => {
  if (!currentPokemonName) {
    console.error("No active Pokémon selected.");
    return;
  }

  const caughtPokemons =
    JSON.parse(localStorage.getItem("caughtPokemons")) || [];

  if (!caughtPokemons.includes(currentPokemonName)) {
    caughtPokemons.push(currentPokemonName);
    localStorage.setItem("caughtPokemons", JSON.stringify(caughtPokemons));

    let overlayState = JSON.parse(localStorage.getItem("overlayState")) || {};
    overlayState[currentPokemonName] = true;
    localStorage.setItem("overlayState", JSON.stringify(overlayState));
    $dialog.close();
  }

  const caughtLi = document.querySelector(
    `[data-name='${currentPokemonName}']`
  );
  if (caughtLi) {
    if (!caughtLi.querySelector(".overlay")) {
      const $overlay = document.createElement("div");
      $overlay.classList.add("overlay");
      $overlay.textContent = "CAUGHT";
      caughtLi.style.position = "relative";
      caughtLi.append($overlay);
    }
  }

  updateCatchReleaseButtons();
};

const loadCurrentStyles = (name) => {
  let getCaughtPokemon = JSON.parse(localStorage.getItem("caughtPokemons"));

  const caughtLi = document.querySelector(`[data-name='${name}']`);
  if (getCaughtPokemon.includes(name)) {
    if (!caughtLi.querySelector(".overlay")) {
      const $overlay = document.createElement("div");
      $overlay.classList.add("overlay");
      $overlay.textContent = "CAUGHT";
      caughtLi.style.position = "relative";
      caughtLi.append($overlay);
    }
  }
};

const releasePokemon = () => {
  if (!currentPokemonName) {
    console.error("No active Pokémon selected.");
    return;
  }

  const caughtPokemons =
    JSON.parse(localStorage.getItem("caughtPokemons")) || [];
  const updatedCaughtPokemons = caughtPokemons.filter(
    (name) => name !== currentPokemonName
  );
  localStorage.setItem("caughtPokemons", JSON.stringify(updatedCaughtPokemons));

  const caughtLi = document.querySelector(
    `[data-name='${currentPokemonName}']`
  );

  if (caughtLi) {
    const overlay = caughtLi.querySelector(".overlay");
    if (overlay) {
      caughtLi.removeChild(overlay);
      $dialog.close();
    }
  }

  updateCatchReleaseButtons();
};

$caught.addEventListener("click", catchPokemon);

$release.addEventListener("click", releasePokemon);

$ulElement.addEventListener("click", (e) => {
  e.preventDefault();
  const $li = e.target.closest("li");
  if ($li) {
    loadModal($li);
    $dialog.showModal();
  }
});

$close.addEventListener("click", function (e) {
  e.preventDefault();
  $dialog.close();

  updateCatchReleaseButtons();
});

$loadButton.addEventListener("click", loadNext);

window.onload = () => {
  fetchPokemonList();
};
