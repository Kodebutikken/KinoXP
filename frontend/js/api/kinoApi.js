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
            ...options,
        });

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

export async function fetchGenres() {
    return await request(`/movies/genres`);
}
