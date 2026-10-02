"use strict";

const state = {
    selectedMovie: null,
    selectedShowing: null,
    selectedSeats: [],
};

export function getState() {
    return state;
}

export function setSelectedShowing(showingId) {
    state.selectedShowing = showingId;
    state.selectedSeats = [];
}

export function toggleSeat(seatId) {
    const index = state.selectedSeats.indexOf(seatId);
    if (index === -1) {
        state.selectedSeats.push(seatId);
    } else {
        state.selectedSeats.splice(index, 1);
    }
    return state.selectedSeats;
}

export function reset() {
    state.selectedMovie = null;
    state.selectedShowing = null;
    state.selectedSeats = [];
}
