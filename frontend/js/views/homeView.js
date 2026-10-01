"use strict";

import { fetchMovies } from "../api/kinoApi.js";
import { createHomeView } from "./homeView.js";

export async function createHomeView() {
    const container = document.createElement("section");
    container.className = "home-page";

    try {
        const movies = await fetchMovies();

        if(!movies || movies.length === 0) {
            const noMoviesNode = document.createElement("p");
            noMoviesNode.textContent = "No movies available.";
            container.appendChild(noMoviesNode);
            return container;
        }

        const featuredMovies = movies.slice(0, 3);
        const heroBanner = createHeroBanner(featuredMovies);
        container.appendChild(heroBanner);


    }
}