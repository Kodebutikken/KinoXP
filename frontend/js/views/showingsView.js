"use strict";

import { fetchMovies, fetchShowings, deleteShowing } from "../api/kinoApi.js";

/**
 * Offentlig visning af forestillinger for en film
 */
export async function createShowingsView({ params }) {
    const container = document.createElement("section");
    container.className = "showings-page";

    const movieId = params ? params.movieId : null;

    const heading = document.createElement("h1");
    heading.textContent = "Showing times";
    container.appendChild(heading);

    if (!movieId) {
        const errorNode = document.createElement("p");
        errorNode.className = "error";
        errorNode.textContent = "No movie ID provided.";
        container.appendChild(errorNode);
        return container;
    }

    const showings = await fetchShowings(movieId);

    if (!showings || showings.length === 0) {
        const noShowingsNode = document.createElement("p");
        noShowingsNode.textContent = "No showings available.";
        container.appendChild(noShowingsNode);
        return container;
    }

    heading.textContent = `Showing times – ${showings[0].movieTitle || ""}`;

    const grid = document.createElement("div");
    grid.className = "showings-grid";

    const template = document.createElement("template");

    showings.forEach((showing) => {
        template.innerHTML = `
        <div class="showing-card">
            <p class="date-time"></p>
            <p class="theater"></p>
            <a class="link" href="" data-link>Choose seats</a>
        </div>
        `;

        const card = template.content.firstElementChild.cloneNode(true);

        card.querySelector(".date-time").textContent = formatStartTime(showing.startTime);
        card.querySelector(".theater").textContent = showing.theaterName || "Unknown theater";
        card.querySelector(".link").href = `/showings/${showing.id}/book`;

        grid.appendChild(card);
    });

    container.appendChild(grid);

    return container;
}

/**
 * Formular til oprettelse og redigering af en forestilling (admin)
 */
export async function renderShowingForm(container, { showing = null, onSubmit, onCancel } = {}) {
    const isEdit = Boolean(showing);

    const formHeading = document.createElement("h2");
    formHeading.textContent = isEdit
        ? `Edit Showing: ${showing.movieTitle || ""}`
        : "Create New Showing";
    container.appendChild(formHeading);

    const form = document.createElement("form");
    form.className = "showing-form";

    // Movie select
    const movieInput = document.createElement("select");
    movieInput.name = "movieId";
    movieInput.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Movie";
    placeholderOption.disabled = true;
    placeholderOption.selected = !showing?.movieId;
    movieInput.appendChild(placeholderOption);

    const movies = await fetchMovies();
    (movies || []).forEach((movie) => {
        const option = document.createElement("option");
        option.value = movie.id;
        option.textContent = movie.title;
        if (showing && showing.movieId === movie.id) {
            option.selected = true;
        }
        movieInput.appendChild(option);
    });
    form.appendChild(movieInput);

    // Theater input (der er ikke noget theaters-endpoint endnu, så vi bruger id)
    const theaterInput = document.createElement("input");
    theaterInput.type = "number";
    theaterInput.name = "theaterId";
    theaterInput.placeholder = "Theater ID";
    theaterInput.min = "1";
    theaterInput.value = showing?.theaterId ?? "";
    theaterInput.required = true;
    form.appendChild(theaterInput);

    // Start time input
    const startTimeInput = document.createElement("input");
    startTimeInput.type = "datetime-local";
    startTimeInput.name = "startTime";
    startTimeInput.value = showing?.startTime ? showing.startTime.slice(0, 16) : "";
    startTimeInput.required = true;
    form.appendChild(startTimeInput);

    // Extra checkbox
    const extraLabel = document.createElement("label");
    const extraInput = document.createElement("input");
    extraInput.type = "checkbox";
    extraInput.name = "extra";
    extraInput.checked = Boolean(showing?.extra);
    extraLabel.append(extraInput, " Extra showing");
    form.appendChild(extraLabel);

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "form-buttons";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = isEdit ? "Update Showing" : "Create Showing";
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
        const showingData = {
            movieId: parseInt(formData.get("movieId"), 10),
            theaterId: parseInt(formData.get("theaterId"), 10),
            startTime: formData.get("startTime"),
            extra: extraInput.checked,
        };

        if (onSubmit) {
            await onSubmit(showingData);
        }
    });

    container.appendChild(form);
}

const WEEKDAYS = [
    ["MONDAY", "Monday"],
    ["TUESDAY", "Tuesday"],
    ["WEDNESDAY", "Wednesday"],
    ["THURSDAY", "Thursday"],
    ["FRIDAY", "Friday"],
    ["SATURDAY", "Saturday"],
    ["SUNDAY", "Sunday"],
];

/**
 * Formular til at generere forestillinger de næste 3 måneder ud fra et ugeprogram (admin)
 */
export async function renderScheduleForm(container, { onSubmit, onCancel } = {}) {
    const formHeading = document.createElement("h2");
    formHeading.textContent = "Generate Showings";
    container.appendChild(formHeading);

    const info = document.createElement("p");
    info.textContent = "Creates showings for the next 3 months on the chosen weekdays and times. Times that conflict with existing showings are skipped.";
    container.appendChild(info);

    const form = document.createElement("form");
    form.className = "schedule-form";

    // Movie select
    const movieInput = document.createElement("select");
    movieInput.name = "movieId";
    movieInput.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Movie";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    movieInput.appendChild(placeholderOption);

    const movies = await fetchMovies();
    (movies || []).forEach((movie) => {
        const option = document.createElement("option");
        option.value = movie.id;
        option.textContent = movie.title;
        movieInput.appendChild(option);
    });
    form.appendChild(movieInput);

    // Theater input
    const theaterInput = document.createElement("input");
    theaterInput.type = "number";
    theaterInput.name = "theaterId";
    theaterInput.placeholder = "Theater ID";
    theaterInput.min = "1";
    theaterInput.required = true;
    form.appendChild(theaterInput);

    // Extra checkbox
    const extraLabel = document.createElement("label");
    const extraInput = document.createElement("input");
    extraInput.type = "checkbox";
    extraInput.name = "extra";
    extraLabel.append(extraInput, " Extra showings");
    form.appendChild(extraLabel);

    // Schedule rows (weekday + time)
    const scheduleList = document.createElement("div");
    scheduleList.className = "schedule-list";
    form.appendChild(scheduleList);

    function addScheduleRow() {
        const row = document.createElement("div");
        row.className = "schedule-row";

        const daySelect = document.createElement("select");
        daySelect.name = "day";
        daySelect.required = true;
        WEEKDAYS.forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            daySelect.appendChild(option);
        });

        const timeInput = document.createElement("input");
        timeInput.type = "time";
        timeInput.name = "time";
        timeInput.required = true;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            if (scheduleList.children.length > 1) row.remove();
        });

        row.append(daySelect, timeInput, removeButton);
        scheduleList.appendChild(row);
    }

    addScheduleRow();

    const addRowButton = document.createElement("button");
    addRowButton.type = "button";
    addRowButton.textContent = "Add time slot";
    addRowButton.addEventListener("click", addScheduleRow);
    form.appendChild(addRowButton);

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "form-buttons";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Generate Showings";
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

        const schedules = Array.from(scheduleList.querySelectorAll(".schedule-row")).map((row) => ({
            day: row.querySelector("select[name='day']").value,
            time: row.querySelector("input[name='time']").value,
        }));

        const scheduleData = {
            movieId: parseInt(movieInput.value, 10),
            theaterId: parseInt(theaterInput.value, 10),
            extra: extraInput.checked,
            schedules,
        };

        if (onSubmit) {
            submitButton.disabled = true;
            submitButton.textContent = "Generating...";
            try {
                await onSubmit(scheduleData);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Generate Showings";
            }
        }
    });

    container.appendChild(form);
}

/**
 * Tabelvisning af forestillinger til admin-panelet.
 * Backend kan kun hente forestillinger pr. film, så man vælger først en film.
 * selectedMovieId/onMovieChange gør, at valget overlever, når viewet tegnes forfra.
 */
export async function renderShowingsSection(container, { onEditShowing, selectedMovieId = null, onMovieChange } = {}) {
    try {
        const movies = await fetchMovies();

        const movieSelect = document.createElement("select");
        movieSelect.name = "movieFilter";

        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = "Select movie to see showings";
        placeholderOption.disabled = true;
        placeholderOption.selected = !selectedMovieId;
        movieSelect.appendChild(placeholderOption);

        (movies || []).forEach((movie) => {
            const option = document.createElement("option");
            option.value = movie.id;
            option.textContent = movie.title;
            if (selectedMovieId && String(movie.id) === String(selectedMovieId)) {
                option.selected = true;
            }
            movieSelect.appendChild(option);
        });
        container.appendChild(movieSelect);

        const tableWrapper = document.createElement("div");
        container.appendChild(tableWrapper);

        // Token sikrer, at et langsomt svar for en tidligere film ikke overskriver den nyeste
        let loadToken = 0;

        async function loadShowings(movieId) {
            const token = ++loadToken;
            tableWrapper.replaceChildren();
            try {
                const showings = await fetchShowings(movieId);
                if (token !== loadToken) return;
                tableWrapper.appendChild(buildShowingsTable(showings, onEditShowing));
            } catch (error) {
                if (token !== loadToken) return;
                console.error("Error while loading showings for admin:", error);
                const alertNode = document.createElement("p");
                alertNode.className = "error";
                alertNode.textContent = "Error while loading showings.";
                tableWrapper.appendChild(alertNode);
            }
        }

        movieSelect.addEventListener("change", () => {
            if (onMovieChange) onMovieChange(movieSelect.value);
            loadShowings(movieSelect.value);
        });

        if (selectedMovieId) {
            await loadShowings(selectedMovieId);
        }
    } catch (error) {
        console.error("Error while loading movies for admin:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading movies.";
        container.appendChild(alertNode);
    }
}

function createNoShowingsNode() {
    const node = document.createElement("p");
    node.textContent = "No showings for this movie.";
    return node;
}

function buildShowingsTable(showings, onEditShowing) {
    if (!showings || showings.length === 0) {
        return createNoShowingsNode();
    }

    const table = document.createElement("table");
    table.className = "admin-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Movie", "Theater", "Start time", "Extra", "Actions"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    showings.forEach((showing) => {
        const row = document.createElement("tr");

        const movieCell = document.createElement("td");
        movieCell.textContent = showing.movieTitle || "";
        const theaterCell = document.createElement("td");
        theaterCell.textContent = showing.theaterName || "";
        const timeCell = document.createElement("td");
        timeCell.textContent = formatStartTime(showing.startTime);
        const extraCell = document.createElement("td");
        extraCell.textContent = showing.extra ? "Yes" : "No";

        const actionsCell = document.createElement("td");

        // Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            if (onEditShowing) onEditShowing(showing);
        });
        actionsCell.appendChild(editButton);

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => {
            const label = `${showing.movieTitle || "showing"} (${formatStartTime(showing.startTime)})`;
            if (confirm(`Are you sure you want to delete the showing "${label}"?`)) {
                try {
                    await deleteShowing(showing.id);
                    alert("Showing has been deleted.");
                    row.remove();
                    if (tbody.children.length === 0) {
                        table.replaceWith(createNoShowingsNode());
                    }
                } catch (error) {
                    console.error("Error while deleting the showing:", error);
                    alert("Failed to delete the showing.");
                }
            }
        });
        actionsCell.appendChild(deleteButton);

        row.append(movieCell, theaterCell, timeCell, extraCell, actionsCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
}

function formatStartTime(startTime) {
    return startTime ? new Date(startTime).toLocaleString("da-DK") : "Unknown time";
}