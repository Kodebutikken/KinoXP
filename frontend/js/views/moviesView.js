import { fetchMovies } from "../api/kinoApi.js";

export async function createMoviesView() {
    const container = document.createElement("section");
    container.className = "movies-page";

    const heading = document.createElement("h1");
    heading.textContent = "Movies playing right now";
    container.appendChild(heading);

    const movies = await fetchMovies();

    const template = document.createElement("template");

    movies.forEach((movie) => {
        template.innerHTML = `
        <div class="movie-card">
            <h2 class="title"></h2>
            <p class="info"></p>
            <a class="link" href="">View showings</a>
        </div>
        `;

    const card = template.content.firstElementChild.cloneNode(true);

    card.querySelector(".title").textContent = movie.title || "Untitled";
    card.querySelector(".info").textContent =
        `${movie.durationMinutes || '?'} min | ${movie.movieGenre || 'Unknown genre'}`;
    card.querySelector(".link").href = `#/showings?movieId=${movie.id}`;

    container.appendChild(card);
    });

    return container;
}
