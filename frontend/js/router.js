"use strict";

import { createHomeView } from "./views/homeView.js";
import { createMoviesView } from "./views/moviesView.js";
import { createShowingsView } from "./views/showingsView.js";
import { createBookingView } from "./views/bookingView.js";
import { createAdminView } from "./views/adminView.js";
import { createNotFoundView } from "./views/notFoundView.js";
import { createLoginView } from "./views/loginView.js";
import { getCurrentUser } from "./api/kinoApi.js";
import {fetchCurrentUser, updateNavbar} from "./components/navbar.js";
import { createCancelView } from "./views/cancelView.js";

const routes = [
    { path: "/", view: createHomeView, title: "Home" },
    { path: "/movies", view: createMoviesView, title: "Movies" },
    { path: "/movies/:movieId/showings", view: createShowingsView, title: "Showings" },
    { path: "/showings/:showingId/book", view: createBookingView, title: "Book seats" },
    { path: "/admin", view: createAdminView, title: "Admin", requiresAuth: true, allowedRoles: ["ADMINISTRATOR"], protected: true },
    { path: "/admin/:section", view: createAdminView, title: "Admin", requiresAuth: true, allowedRoles: ["ADMINISTRATOR"], protected: true },
    { path: "/auth/login", view: createLoginView, title: "Login" },
    { path: "/cancel", view: createCancelView, title: "Cancel tickets" },
];

const compiledRoutes = routes.map(compileRoute);

let renderToken = 0;

function compileRoute(route) {
    const paramNames = [];
    const pattern = route.path
        .split("/")
        .filter(Boolean)
        .map((segment) => {
            if (segment.startsWith(":")) {
                paramNames.push(segment.slice(1));
                return "([^/]+)";
            }
            return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/");

    return {
        ...route,
        regex: new RegExp(`^/${pattern}/?$`),
        paramNames,
    };
}

function matchRoute(pathname) {
    for (const route of compiledRoutes) {
        const match = route.regex.exec(pathname);
        if (match) {
            const params = {};
            route.paramNames.forEach((name, index) => {
                params[name] = decodeURIComponent(match[index + 1]);
            });
            return { route, params };
        }
    }
    return null;
}

export function navigate(path) {
    if (path !== window.location.pathname + window.location.search) {
        window.history.pushState(null, "", path);
    }
    render();
}

export function initRouter() {
    window.addEventListener("popstate", render);
    document.addEventListener("click", handleLinkClick);
    render();
}

function handleLinkClick(event) {
    const link = event.target.closest("a[data-link]");
    if (!link) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank") return;
    if (link.origin !== window.location.origin) return;

    event.preventDefault();
    navigate(link.pathname + link.search);
}

function updateActiveNavLinks(pathname) {
    document.querySelectorAll("nav a[data-link]").forEach((link) => {
        const isActive = link.pathname === pathname;
        link.classList.toggle("active", isActive);
        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

async function render() {

    await updateNavbar();

    const token = ++renderToken;
    const appContainer = document.getElementById("app");
    const pathname = window.location.pathname;
    const query = new URLSearchParams(window.location.search);

    const matched = matchRoute(pathname);

    if (!matched) {
        appContainer.replaceChildren(createNotFoundView());
        document.title = "KinoXP – Not found";
        updateActiveNavLinks(pathname);
        return;
    }

    if(matched.route.protected) {
        const user = await fetchCurrentUser();

        if(!user) {
            navigate("/auth/login");
            return;
        }

        if (matched.route.allowedRoles && !matched.route.allowedRoles.includes(user.role)) {
            console.warn("Unauthorized acces attempt: ", pathname);
            navigate("/"); // Omdiriger til forsiden hvis de ikke har den rette rolle
            return;
        }
    }

    const loadingNode = document.createElement("p");
    loadingNode.textContent = "Loading data...";
    appContainer.replaceChildren(loadingNode);

    try {
        const viewNode = await matched.route.view({ params: matched.params, query });

        if (token !== renderToken) return;

        appContainer.replaceChildren(viewNode);
        document.title = `KinoXP – ${matched.route.title}`;
        updateActiveNavLinks(pathname);

        await updateNavbar();

        appContainer.focus();
    } catch (error) {
        if (token !== renderToken) return;

        console.error("Error while loading view:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading.";
        appContainer.replaceChildren(alertNode);
    }
}
