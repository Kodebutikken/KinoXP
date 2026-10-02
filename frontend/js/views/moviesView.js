"use strict";

import { fetchMovies } from "../api/kinoApi.js";

export async function createMoviesView() {
    const container = document.createElement("section");
    container.className = "movies-page";

    const heading = document.createElement("h1");
    heading.textContent = "Movies playing right now";
    container.appendChild(heading);

    const movies = await fetchMovies();

    if (!movies || movies.length === 0) {
        const noMoviesNode = document.createElement("p");
        noMoviesNode.textContent = "No movies available.";
        container.appendChild(noMoviesNode);
        return container;
    }

    const grid = document.createElement("div");
    grid.className = "movies-grid";

    const template = document.createElement("template");

    movies.forEach((movie) => {
        template.innerHTML = `
        <div class="movie-card">
            <h2 class="title"></h2>
            <p class="info"></p>
            <p class="description"></p>
            <a class="link" href="" data-link>View showings</a>
        </div>
        `;

        const card = template.content.firstElementChild.cloneNode(true);

        card.querySelector(".title").textContent = movie.title || "Untitled";
        card.querySelector(".info").textContent =
            `${movie.durationMinutes || "?"} min | ${movie.movieGenre || "Unknown genre"} | ${movie.ageLimit}+`;
        card.querySelector(".description").textContent = movie.description || "";
        card.querySelector(".link").href = `/movies/${movie.id}/showings`;

        grid.appendChild(card);
    });

    container.appendChild(grid);

    return container;
}
