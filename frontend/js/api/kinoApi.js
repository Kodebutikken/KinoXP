"use strict";

const API_BASE = "/api";

export async function fetchMovies() {
    return await request("/movies");
}

export async function fetchShowings(movieId) {
    return await request(`/showings?movieId=${encodeURIComponent(movieId)}`);
}

async function request(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            credentials: "include",
            ...options,
        });

        if(response.status === 401 && endpoint === "/auth/me") return null;

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
    }
}

export async function addMovie(movieData) {
    return await request("/movies", {
        method: "POST",
        body: JSON.stringify(movieData),
    });
}

export async function updateMovie(movieId, movieData) {
    return await request(`/movies/${encodeURIComponent(movieId)}/edit`, {
        method: "PUT",
        body: JSON.stringify(movieData),
    });
}

export async function deleteMovie(movieId) {
    return await request(`/movies/${encodeURIComponent(movieId)}`, {
        method: "DELETE",
    });
}

export async function toggleActiveStatus(movieId, active) {
    return await request(`/movies/${encodeURIComponent(movieId)}/status?active=${active}`, {
        method: "PUT",
    });
}

export async function fetchGenres() {
    return await request(`/movies/genres`);
}

export async function loginUser(credentials) {
    return await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}

export async function logoutUser() {
    return await request("/auth/logout", {
        method: "POST",
    });
}

export async function getCurrentUser() {
    try {
        return await request("/auth/me");
    } catch (error) {
        if(error.message.includes("401")) {
            return null;
        }
        throw error;
    }
}
export async function fetchSeatsForShowing(showingId) {
    return await request(`/showings/${encodeURIComponent(showingId)}/seats`);
}

export async function createReservation(reservationData) {
    return await request("/reservations", {
        method: "POST",
        body: JSON.stringify(reservationData),
    });
}
export async function addShowing(showingData) {
    return await request("/showings", {
        method: "POST",
        body: JSON.stringify(showingData),
    });
}

export async function updateShowing(showingId, showingData) {
    return await request(`/showings/${encodeURIComponent(showingId)}/edit`, {
        method: "PUT",
        body: JSON.stringify(showingData),
    });
}

export async function deleteShowing(showingId) {
    return await request(`/showings/${encodeURIComponent(showingId)}`, {
        method: "DELETE",
    });
}
