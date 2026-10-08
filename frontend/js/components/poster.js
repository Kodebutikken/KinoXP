"use strict";

// Vi har ingen plakatbilleder i databasen, så vi genererer en farvet "plakat" ud fra filmens id
export function createPoster(movie) {
    const poster = document.createElement("div");
    poster.className = "poster";
    poster.style.setProperty("--hue", posterHue(movie.id));

    const fallback = createGeneratedPosterContent(movie);
    const coverUrl = movie.coverUrl;

    if (!coverUrl) {
        poster.appendChild(fallback);
        return poster;
    }

    const skeleton = document.createElement("div");
    skeleton.className = "skeleton poster-skeleton";
    skeleton.setAttribute("aria-label", "Loading poster");
    poster.setAttribute("aria-busy", "true");

    const image = document.createElement("img");
    image.className = "poster-img";
    image.alt = movie.title || "Untitled";
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("load", () => {
        skeleton.remove();
        image.classList.add("loaded");
        poster.removeAttribute("aria-busy");
    }, { once: true });

    image.addEventListener("error", () => {
        image.remove();
        skeleton.remove();
        poster.removeAttribute("aria-busy");
        poster.appendChild(fallback);
    }, { once: true });

    const age = document.createElement("span");
    age.className = "poster-age";
    age.textContent = formatAge(movie.ageLimit);
    poster.appendChild(age);

    poster.append(skeleton, image);
    image.src = coverUrl;

    return poster;
}

function createGeneratedPosterContent(movie) {
    const content = document.createElement("div");
    content.className = "poster-fallback";

    const age = document.createElement("span");
    age.className = "poster-age";
    age.textContent = formatAge(movie.ageLimit);

    const name = document.createElement("span");
    name.className = "poster-name";
    name.textContent = movie.title || "Untitled";

    content.append(age, name);
    return content;
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
