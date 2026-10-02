"use strict";

import { fetchMovies } from "../api/kinoApi.js";

export async function createHomeView() {
    const container = document.createElement("section");
    container.className = "home-page";

    const heading = document.createElement("h1");
    heading.textContent = "Welcome to KinoXP";
    container.appendChild(heading);

    try {
        const movies = await fetchMovies();

        if (!movies || movies.length === 0) {
            const noMoviesNode = document.createElement("p");
            noMoviesNode.textContent = "No movies available.";
            container.appendChild(noMoviesNode);
            return container;
        }

        const featuredMovies = movies.slice(0, 3);
        const heroBanner = createHeroBanner(featuredMovies);
        container.appendChild(heroBanner);

        const seeAllLink = document.createElement("a");
        seeAllLink.className = "see-all-link";
        seeAllLink.href = "/movies";
        seeAllLink.setAttribute("data-link", "");
        seeAllLink.textContent = "See all movies";
        container.appendChild(seeAllLink);
    } catch (error) {
        console.error("Error while loading home view:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading movies.";
        container.appendChild(alertNode);
    }

    return container;
}

function createHeroBanner(movies) {
    const banner = document.createElement("div");
    banner.className = "hero-banner";

    const template = document.createElement("template");

    movies.forEach((movie) => {
        template.innerHTML = `
        <a class="hero-card" href="" data-link>
            <h2 class="title"></h2>
            <p class="info"></p>
        </a>
        `;

        const card = template.content.firstElementChild.cloneNode(true);

        card.querySelector(".title").textContent = movie.title || "Untitled";
        card.querySelector(".info").textContent =
            `${movie.durationMinutes || "?"} min | ${movie.movieGenre || "Unknown genre"}`;
        card.href = `/movies/${movie.id}/showings`;

        banner.appendChild(card);
    });

    return banner;
}
