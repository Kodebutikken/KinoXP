"use strict";

import {fetchMovies, deleteMovie, fetchGenres, toggleActiveStatus} from "../api/kinoApi.js";
import { createPoster, movieMeta, formatGenre } from "../components/poster.js";
import { showToast } from "../components/toast.js";

export async function createMoviesView() {
    const container = document.createElement("section");
    container.className = "movies-page";

    const header = document.createElement("header");
    header.className = "page-header";

    const pageH1 = document.createElement("h1");
    pageH1.textContent = "Movies playing right now";
    header.appendChild(pageH1);

    const subtitle = document.createElement("p");
    subtitle.className = "page-lead";
    subtitle.textContent = "Pick a movie to see showing times and book your seats.";
    header.appendChild(subtitle);

    container.appendChild(header);

    const movies = await fetchMovies();

    const activeMovies = (movies || []).filter((movie) => movie.active);

    if (!activeMovies || activeMovies.length === 0) {
        const noMoviesNode = document.createElement("p");
        noMoviesNode.className = "page-lead";
        noMoviesNode.textContent = "No movies are playing right now. New titles are added every week.";
        container.appendChild(noMoviesNode);
        return container;
    }

    const grid = document.createElement("div");
    grid.className = "movies-grid";

    const template = document.createElement("template");

    activeMovies.forEach((movie) => {
        template.innerHTML = `
        <a class="movie-card" href="" data-link>
            <div class="poster-slot"></div>
            <h2 class="title"></h2>
            <p class="info"></p>
            <p class="description"></p>
            <span class="link">View showings →</span>
        </a>
        `;

        const card = template.content.firstElementChild.cloneNode(true);

        card.href = `/movies/${movie.id}/showings`;
        card.querySelector(".poster-slot").replaceWith(createPoster(movie));
        card.querySelector(".title").textContent = movie.title || "Untitled";
        card.querySelector(".info").textContent = movieMeta(movie);
        card.querySelector(".description").textContent = movie.description || "";

        grid.appendChild(card);
    });

    container.appendChild(grid);

    return container;
}

// Pakker et felt ind i en <label>, så det har en synlig tekst og ikke kun en placeholder
function createField(labelText, input, hint) {
    const label = document.createElement("label");
    label.className = "field";

    const text = document.createElement("span");
    text.className = "field-label";
    text.textContent = labelText;

    label.append(text, input);

    if (hint) {
        const hintNode = document.createElement("p");
        hintNode.className = "field-hint";
        hintNode.textContent = hint;
        label.appendChild(hintNode);
    }

    return label;
}

export async function renderMovieForm(container, { movie = null, onSubmit, onCancel } = {}) {
    const isEdit = Boolean(movie);

    const formHeading = document.createElement("h2");
    formHeading.textContent = isEdit ? `Edit movie: ${movie.title}` : "Create new movie";
    container.appendChild(formHeading);

    const form = document.createElement("form");
    form.className = "admin-form";

    // Title input
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.className = "input-field";
    titleInput.placeholder = "e.g. The Last Lighthouse";
    titleInput.value = movie?.title || "";
    titleInput.required = true;
    form.appendChild(createField("Title", titleInput));

    // Duration input
    const durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.name = "duration";
    durationInput.className = "input-field";
    durationInput.min = "1";
    durationInput.placeholder = "112";
    durationInput.value = movie?.durationMinutes || "";
    durationInput.required = true;

    // Age Limit input
    const ageLimitInput = document.createElement("input");
    ageLimitInput.type = "number";
    ageLimitInput.name = "ageLimit";
    ageLimitInput.className = "input-field";
    ageLimitInput.min = "0";
    ageLimitInput.placeholder = "11";
    ageLimitInput.value = movie?.ageLimit ?? "";
    ageLimitInput.required = true;

    const numbersRow = document.createElement("div");
    numbersRow.className = "field-row";
    numbersRow.append(
        createField("Duration (minutes)", durationInput),
        createField("Age limit", ageLimitInput, "Use 0 for all ages.")
    );
    form.appendChild(numbersRow);

    // Genre select
    const genreInput = document.createElement("select");
    genreInput.name = "genre";
    genreInput.className = "input-field";
    genreInput.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select genre";
    placeholderOption.disabled = true;
    placeholderOption.selected = !movie?.movieGenre;
    genreInput.appendChild(placeholderOption);

    const genres = await fetchGenres();
    genres.forEach((genre) => {
        const option = document.createElement("option");
        option.className = "genre-option";
        option.value = genre;
        option.textContent = formatGenre(genre);
        if (movie && movie.movieGenre === genre) {
            option.selected = true;
        }
        genreInput.appendChild(option);
    });
    form.appendChild(createField("Genre", genreInput));

    // Description input
    const descriptionInput = document.createElement("textarea");
    descriptionInput.className = "input-field";
    descriptionInput.name = "description";
    descriptionInput.placeholder = "A short summary shown on the movie page.";
    descriptionInput.value = movie?.description || "";
    form.appendChild(createField("Description", descriptionInput));

    // Cover image URL input
    const coverImageInput = document.createElement("input");
    coverImageInput.type = "url";
    coverImageInput.name = "coverImageUrl";
    coverImageInput.className = "input-field";
    coverImageInput.placeholder = "https://example.com/cover.jpg";
    coverImageInput.value = movie?.coverUrl || "";
    form.appendChild(createField("Cover image URL", coverImageInput, "Optional. A URL to the movie's poster image."));

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "form-buttons";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "btn-primary";
    submitButton.textContent = isEdit ? "Save changes" : "Create movie";
    buttonGroup.appendChild(submitButton);

    if (onCancel) {
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "btn-secondary";
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
            coverUrl: formData.get("coverImageUrl"),
            active: formData.get("isActive") === "true",
        };

        if (onSubmit) {
            submitButton.disabled = true;
            try {
                await onSubmit(movieData);
            } finally {
                submitButton.disabled = false;
            }
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

        if (!movies || movies.length === 0) {
            const empty = document.createElement("p");
            empty.className = "page-lead";
            empty.textContent = "No movies yet. Create the first one to start adding showings.";
            container.appendChild(empty);
            return;
        }

        const table = document.createElement("table");
        table.className = "admin-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["Title", "Genre", "Age limit", "Status", "Actions"].forEach((label) => {
            const th = document.createElement("th");
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        movies.forEach((movie) => {
            const row = document.createElement("tr");

            const titleCell = document.createElement("td");
            titleCell.textContent = movie.title || "";
            const genreCell = document.createElement("td");
            genreCell.textContent = movie.movieGenre ? formatGenre(movie.movieGenre) : "";
            const ageLimitCell = document.createElement("td");
            ageLimitCell.textContent = movie.ageLimit ?? "";
            const activeCell = document.createElement("td");
            const status = document.createElement("span");
            status.className = movie.active ? "status-pill is-on" : "status-pill";
            status.textContent = movie.active ? "Active" : "Inactive";
            activeCell.appendChild(status);

            const actionsCell = document.createElement("td");

            // Edit button
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "btn-secondary btn-small";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                if (onEditMovie) onEditMovie(movie);
            });
            actionsCell.appendChild(editButton);

            // Toggle active button
            const toggleActiveButton = document.createElement("button");
            toggleActiveButton.type = "button";
            toggleActiveButton.className = "btn-secondary btn-small";
            toggleActiveButton.textContent = movie.active ? "Deactivate" : "Activate";
            toggleActiveButton.addEventListener("click", async () => {
                try {
                    await toggleActiveStatus(movie.id, !movie.active);
                    showToast(`"${movie.title}" is now ${movie.active ? "inactive" : "active"}.`);
                    if (refreshView) await refreshView();
                } catch (error) {
                    console.error("Error toggling active state:", error);
                    showToast(error.message, "error");
                }
            });
            actionsCell.appendChild(toggleActiveButton);

            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn-secondary btn-small btn-danger";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", async () => {
                if (confirm(`Are you sure you want to delete the movie "${movie.title}"?`)) {
                    try {
                        await deleteMovie(movie.id);
                        showToast(`"${movie.title}" was deleted.`);
                        row.remove();
                    } catch (error) {
                        console.error("Error while deleting the movie:", error);
                        showToast(error.message, "error");
                    }
                }
            });
            actionsCell.appendChild(deleteButton);

            row.append(titleCell, genreCell, ageLimitCell, activeCell, actionsCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    } catch (error) {
        console.error("Error while loading movies for admin:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Could not load movies. Please try again.";
        container.appendChild(alertNode);
    }
}
