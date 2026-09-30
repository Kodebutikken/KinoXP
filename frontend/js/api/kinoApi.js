"use strict";

const API_BASE = "http://localhost:8080/api";

export async function fetchMovies() {
    return await request("/movies");
}

export async function fetchShowings() {
    return await request("/showings");
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
