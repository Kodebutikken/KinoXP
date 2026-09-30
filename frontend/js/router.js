const routes = {};

export function initRouter() {
    window.addEventListener("hashchange", handleRoute);
    window.addEventListener("DOMContentLoaded", handleRoute);
}

async function handleRoute() {
    const rawHash = window.location.hash.slice(1) || "/";
    const [path, queryString] = rawHash.split("?");
    const params = new URLSearchParams(queryString || "");

    const route = routes[path];
    const appContainer = document.getElementById("app");

    if (!route) {
        const errorNode = document.createElement("h1");
        errorNode.textContent = "404 - Site not found";
        appContainer.replaceChildren(errorNode);
        return;
    }

    const loadingNode = document.createElement("p");
    loadingNode.textContent = "Loading data...";
    appContainer.replaceChildren(loadingNode);

    try {
        const viewNode = await route.render(params);

        appContainer.replaceChildren(viewNode);
    } catch (error) {
        console.error("Error while loading view:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading.";
        appContainer.replaceChildren(alertNode);
    }
}
