"use strict";

import {fetchMovies, fetchShowings, deleteShowing} from "../api/kinoApi.js";
import { createPoster, movieMeta, formatDateTime, formatTime } from "../components/poster.js";
import { showToast } from "../components/toast.js";

/**
 * Offentlig visning af forestillinger for en film
 */
export async function createShowingsView({ params }) {
    const container = document.createElement("section");
    container.className = "showings-page";

    const movieId = params ? params.movieId : null;

    const backLink = document.createElement("a");
    backLink.className = "back-link";
    backLink.href = "/movies";
    backLink.setAttribute("data-link", "");
    backLink.textContent = "← All movies";
    container.appendChild(backLink);

    if (!movieId) {
        const errorNode = document.createElement("p");
        errorNode.className = "error";
        errorNode.textContent = "No movie ID provided.";
        container.appendChild(errorNode);
        return container;
    }

    // Der findes ikke et endpoint for én film med MovieResponse, så vi finder den i listen
    const [showings, movies] = await Promise.all([
        fetchShowings(movieId),
        fetchMovies().catch(() => []),
    ]);

    const movie = (movies || []).find((m) => String(m.id) === String(movieId))
        || { id: movieId, title: showings?.[0]?.movieTitle || "Showing times" };

    container.appendChild(createShowingsHero(movie));

    const upcoming = (showings || [])
        .map((showing) => ({ ...showing, start: new Date(showing.startTime) }))
        .filter((showing) => showing.start >= new Date())
        .sort((a, b) => a.start - b.start);

    if (upcoming.length === 0) {
        const noShowingsNode = document.createElement("p");
        noShowingsNode.className = "page-lead";
        noShowingsNode.textContent = "There are no upcoming showings for this movie yet.";
        container.appendChild(noShowingsNode);
        return container;
    }

    const byDay = new Map();
    upcoming.forEach((showing) => {
        const key = showing.start.toDateString();
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(showing);
    });

    const days = document.createElement("div");
    days.className = "showings-days";

    byDay.forEach((dayShowings) => {
        const date = dayShowings[0].start;

        const row = document.createElement("div");
        row.className = "showings-day";

        const label = document.createElement("p");
        label.className = "showings-day-label";
        label.textContent = date.toLocaleDateString("en-GB", { weekday: "long" });
        const dateText = document.createElement("span");
        dateText.textContent = date.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
        label.appendChild(dateText);

        const times = document.createElement("div");
        times.className = "time-list";
        dayShowings.forEach((showing) => times.appendChild(createTimeChip(showing)));

        row.append(label, times);
        days.appendChild(row);
    });

    container.appendChild(days);

    return container;
}

function createShowingsHero(movie) {
    const hero = document.createElement("header");
    hero.className = "showings-hero";

    const text = document.createElement("div");

    const heading = document.createElement("h1");
    heading.textContent = movie.title || "Showing times";
    text.appendChild(heading);

    if (movie.durationMinutes || movie.movieGenre) {
        const meta = document.createElement("p");
        meta.className = "showings-meta";
        meta.textContent = movieMeta(movie);
        text.appendChild(meta);
    }

    if (movie.description) {
        const description = document.createElement("p");
        description.className = "showings-description";
        description.textContent = movie.description;
        text.appendChild(description);
    }

    hero.append(createPoster(movie), text);
    return hero;
}

function createTimeChip(showing) {
    const chip = document.createElement("a");
    chip.className = "time-chip";
    chip.href = `/showings/${showing.id}/book`;
    chip.setAttribute("data-link", "");
    chip.setAttribute("aria-label", `Choose seats for ${formatDateTime(showing.startTime)}`);

    const time = document.createElement("span");
    time.className = "time-chip-time";
    time.textContent = formatTime(showing.start);

    const theater = document.createElement("span");
    theater.className = "time-chip-theater";
    theater.textContent = showing.theaterName || "";

    chip.append(time, theater);
    return chip;
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

/**
 * Formular til oprettelse og redigering af en forestilling (admin)
 */
export async function renderShowingForm(container, { showing = null, onSubmit, onCancel } = {}) {
    const isEdit = Boolean(showing);

    const formHeading = document.createElement("h2");
    formHeading.textContent = isEdit
        ? `Edit showing: ${showing.movieTitle || ""}`
        : "Create new showing";
    container.appendChild(formHeading);

    const form = document.createElement("form");
    form.className = "showing-form";

    // Movie select
    const movieInput = document.createElement("select");
    movieInput.name = "movieId";
    movieInput.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.className = "optional-field";
    placeholderOption.textContent = "Select movie";
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
    form.appendChild(createField("Movie", movieInput));

    // Theater input (der er ikke noget theaters-endpoint endnu, så vi bruger id)
    const theaterInput = document.createElement("input");
    theaterInput.type = "number";
    theaterInput.name = "theaterId";
    theaterInput.placeholder = "1";
    theaterInput.min = "1";
    theaterInput.value = showing?.theaterId ?? "";
    theaterInput.required = true;

    // Start time input
    const startTimeInput = document.createElement("input");
    startTimeInput.type = "datetime-local";
    startTimeInput.name = "startTime";
    startTimeInput.value = showing?.startTime ? showing.startTime.slice(0, 16) : "";
    startTimeInput.required = true;

    const row = document.createElement("div");
    row.className = "field-row";
    row.append(
        createField("Theater ID", theaterInput),
        createField("Start time", startTimeInput, "Must be in the future.")
    );
    form.appendChild(row);

    // Extra checkbox
    const extraLabel = document.createElement("label");
    extraLabel.className = "check-label";
    const extraInput = document.createElement("input");
    extraInput.type = "checkbox";
    extraInput.name = "extra";
    extraInput.checked = Boolean(showing?.extra);
    extraLabel.append(extraInput, "Extra showing");
    form.appendChild(extraLabel);

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "form-buttons";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "btn-primary";
    submitButton.textContent = isEdit ? "Save changes" : "Create showing";
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
        const showingData = {
            movieId: parseInt(formData.get("movieId"), 10),
            theaterId: parseInt(formData.get("theaterId"), 10),
            startTime: formData.get("startTime"),
            extra: extraInput.checked,
        };

        if (onSubmit) {
            submitButton.disabled = true;
            try {
                await onSubmit(showingData);
            } finally {
                submitButton.disabled = false;
            }
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
    formHeading.textContent = "Generate showings";
    container.appendChild(formHeading);

    const info = document.createElement("p");
    info.className = "page-lead";
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
    placeholderOption.textContent = "Select movie";
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

    // Theater input
    const theaterInput = document.createElement("input");
    theaterInput.type = "number";
    theaterInput.name = "theaterId";
    theaterInput.placeholder = "1";
    theaterInput.min = "1";
    theaterInput.required = true;

    const topRow = document.createElement("div");
    topRow.className = "field-row";
    topRow.append(createField("Movie", movieInput), createField("Theater ID", theaterInput));
    form.appendChild(topRow);

    // Extra checkbox
    const extraLabel = document.createElement("label");
    extraLabel.className = "check-label";
    const extraInput = document.createElement("input");
    extraInput.type = "checkbox";
    extraInput.name = "extra";
    extraLabel.append(extraInput, "Extra showings");
    form.appendChild(extraLabel);

    // Schedule rows (weekday + time)
    const scheduleLabel = document.createElement("span");
    scheduleLabel.className = "field-label";
    scheduleLabel.textContent = "Weekly time slots";
    form.appendChild(scheduleLabel);

    const scheduleList = document.createElement("div");
    scheduleList.className = "schedule-list";
    form.appendChild(scheduleList);

    function addScheduleRow() {
        const row = document.createElement("div");
        row.className = "schedule-row";

        const daySelect = document.createElement("select");
        daySelect.name = "day";
        daySelect.required = true;
        daySelect.setAttribute("aria-label", "Weekday");
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
        timeInput.setAttribute("aria-label", "Time");

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn-secondary btn-small";
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
    addRowButton.className = "btn-tertiary";
    addRowButton.textContent = "+ Add time slot";
    addRowButton.addEventListener("click", addScheduleRow);
    form.appendChild(addRowButton);

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "form-buttons";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "btn-primary";
    submitButton.textContent = "Generate showings";
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
            submitButton.textContent = "Generating…";
            try {
                await onSubmit(scheduleData);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Generate showings";
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
        movieSelect.setAttribute("aria-label", "Movie");

        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = "Select a movie to see its showings";
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
                alertNode.textContent = "Could not load showings. Please try again.";
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
        alertNode.textContent = "Could not load movies. Please try again.";
        container.appendChild(alertNode);
    }
}

function createNoShowingsNode() {
    const node = document.createElement("p");
    node.className = "page-lead";
    node.textContent = "No showings for this movie yet.";
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
        timeCell.textContent = formatDateTime(showing.startTime);
        const extraCell = document.createElement("td");
        extraCell.textContent = showing.extra ? "Yes" : "No";

        const actionsCell = document.createElement("td");

        // Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn-secondary btn-small";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            if (onEditShowing) onEditShowing(showing);
        });
        actionsCell.appendChild(editButton);

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn-secondary btn-small btn-danger";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => {
            const label = `${showing.movieTitle || "showing"} (${formatDateTime(showing.startTime)})`;
            if (confirm(`Are you sure you want to delete the showing "${label}"?`)) {
                try {
                    await deleteShowing(showing.id);
                    showToast("The showing was deleted.");
                    row.remove();
                    if (tbody.children.length === 0) {
                        table.replaceWith(createNoShowingsNode());
                    }
                } catch (error) {
                    console.error("Error while deleting the showing:", error);
                    showToast("Could not delete the showing. Please try again.", "error");
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
