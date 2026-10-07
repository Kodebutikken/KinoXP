"use strict";

// Vi har ingen plakatbilleder i databasen, så vi genererer en farvet "plakat" ud fra filmens id
export function createPoster(movie) {
    const template = document.createElement("template");
    template.innerHTML = `
    <div class="poster">
        <span class="poster-age"></span>
        <span class="poster-name"></span>
    </div>
    `;
    const poster = template.content.firstElementChild.cloneNode(true);
    poster.style.setProperty("--hue", posterHue(movie.id));
    poster.querySelector(".poster-age").textContent = formatAge(movie.ageLimit);
    poster.querySelector(".poster-name").textContent = movie.title || "Untitled";
    return poster;
}

export function posterHue(id) {
    return (Number(id) * 47) % 360;
}

export function movieMeta(movie) {
    return [
        movie.durationMinutes ? `${movie.durationMinutes} min` : null,
        formatGenre(movie.movieGenre),
        formatAge(movie.ageLimit),
    ].filter(Boolean).join(" · ");
}

export function formatGenre(genre) {
    if (!genre) return "Unknown genre";
    const words = genre.toLowerCase().split("_");
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(" ");
}

export function formatAge(ageLimit) {
    if (ageLimit === null || ageLimit === undefined) return "";
    return ageLimit === 0 ? "All ages" : `${ageLimit}+`;
}

export function formatSeat(seat) {
    return `${String.fromCharCode(64 + seat.seatRow)}${seat.seatNumber}`;
}

export function formatDateTime(startTime) {
    if (!startTime) return "Unknown time";
    return new Date(startTime).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatTime(date) {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
