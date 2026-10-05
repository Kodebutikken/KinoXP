"use strict";

import {fetchMovies, deleteMovie, updateMovie, addMovie, fetchGenres, toggleActiveStatus} from "../api/kinoApi.js";

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

export async function renderMovieForm(container, { movie = null, onSubmit, onCancel } = {}) {
    const isEdit = Boolean(movie);

    const formHeading = document.createElement("h2");
    formHeading.textContent = isEdit ? `Edit Movie: ${movie.title}` : "Create New Movie";
    container.appendChild(formHeading);

    const form = document.createElement("form");
    form.className = "movie-form";

    // Title input
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.placeholder = "Movie Title";
    titleInput.value = movie?.title || "";
    titleInput.required = true;
    form.appendChild(titleInput);

    // Duration input
    const durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.name = "duration";
    durationInput.placeholder = "Duration (minutes)";
    durationInput.value = movie?.durationMinutes || "";
    durationInput.required = true;
    form.appendChild(durationInput);

    // Age Limit input
    const ageLimitInput = document.createElement("input");
    ageLimitInput.type = "number";
    ageLimitInput.name = "ageLimit";
    ageLimitInput.placeholder = "Age Limit";
    ageLimitInput.value = movie?.ageLimit ?? "";
    ageLimitInput.required = true;
    form.appendChild(ageLimitInput);

    // Description input
    const descriptionInput = document.createElement("textarea");
    descriptionInput.name = "description";
    descriptionInput.placeholder = "Description";
    descriptionInput.value = movie?.description || "";
    form.appendChild(descriptionInput);

    // Genre select
    const genreInput = document.createElement("select");
    genreInput.name = "genre";
    genreInput.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Genre";
    placeholderOption.disabled = true;
    placeholderOption.selected = !movie?.movieGenre;
    genreInput.appendChild(placeholderOption);

    const genres = await fetchGenres();
    genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = genre;
        option.textContent = genre;
        if (movie && movie.movieGenre === genre) {
            option.selected = true;
        }
        genreInput.appendChild(option);
    });
    form.appendChild(genreInput);

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "form-buttons";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = isEdit ? "Update Movie" : "Create Movie";
    buttonGroup.appendChild(submitButton);

    if (onCancel) {
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", onCancel);
        buttonGroup.appendChild(cancelButton);
    }

    form.appendChild(buttonGroup);

    // Submit handler
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const movieData = {
            title: formData.get("title"),
            durationMinutes: parseInt(formData.get("duration"), 10),
            ageLimit: parseInt(formData.get("ageLimit"), 10),
            description: formData.get("description"),
            movieGenre: formData.get("genre"),
            active: formData.get("isActive") === "on",
        };

        if (onSubmit) {
            await onSubmit(movieData);
        }
    });

    container.appendChild(form);
}

/**
 * Tabelvisning af film til admin-panelet
 */
export async function renderMoviesSection(container, { onEditMovie, refreshView }) {
    try {
        const movies = await fetchMovies();

        const table = document.createElement("table");
        table.className = "admin-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["Title", "Genre", "Age limit", "Active", "Actions"].forEach((label) => {
            const th = document.createElement("th");
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        (movies || []).forEach((movie) => {
            const row = document.createElement("tr");

            const titleCell = document.createElement("td");
            titleCell.textContent = movie.title || "";
            const genreCell = document.createElement("td");
            genreCell.textContent = movie.movieGenre || "";
            const ageLimitCell = document.createElement("td");
            ageLimitCell.textContent = movie.ageLimit ?? "";
            const activeCell = document.createElement("td");
            activeCell.textContent = movie.active ? "Yes" : "No";

            const actionsCell = document.createElement("td");

            // Edit button
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                if (onEditMovie) onEditMovie(movie);
            });
            actionsCell.appendChild(editButton);

            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", async () => {
                if (confirm(`Are you sure you want to delete the movie "${movie.title}"?`)) {
                    try {
                        await deleteMovie(movie.id);
                        alert(`Movie "${movie.title}" has been deleted.`);
                        row.remove();
                    } catch (error) {
                        console.error("Error while deleting the movie:", error);
                        alert("Failed to delete the movie.");
                    }
                }
            });
            actionsCell.appendChild(deleteButton);

            // Toggle active button
            const toggleActiveButton = document.createElement("button");
            toggleActiveButton.type = "button";
            toggleActiveButton.textContent = movie.active ? "Deactivate" : "Activate";
            toggleActiveButton.addEventListener("click", async () => {
                try {
                    await toggleActiveStatus(movie.id, !movie.active);
                    if (refreshView) await refreshView();
                } catch (error) {
                    console.error("Error toggling active state:", error);
                    alert("Failed to toggle active state.");
                }
            });
            actionsCell.appendChild(toggleActiveButton);

            row.append(titleCell, genreCell, ageLimitCell, activeCell, actionsCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    } catch (error) {
        console.error("Error while loading movies for admin:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading movies.";
        container.appendChild(alertNode);
    }
}
