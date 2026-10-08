import {getCurrentUser, logoutUser} from "../api/kinoApi.js";
import {navigate} from "../router.js";


let cachedUser = null;
let isUserFetched = false;

export async function fetchCurrentUser() {
    if (isUserFetched) {
        return cachedUser;
    }

    try {
        cachedUser = await getCurrentUser();
    } catch (error) {
        cachedUser = null;
    } finally {
        isUserFetched = true;
    }
    return cachedUser;
}

export function clearUserCache() {
    cachedUser = null;
    isUserFetched = false;
}

export async function updateNavbar() {
    const adminNavItem = document.getElementById("admin-nav-item");
    const authItem = document.querySelector("nav .nav-auth");

    if (!authItem) return;

    if (!isUserFetched) {
        await fetchCurrentUser();
    }

    const user = cachedUser;

    if (adminNavItem) {
        const hasAdminAccess = user && (user.role === "ADMINISTRATOR" || user.role === "EMPLOYEE");
        adminNavItem.style.display = hasAdminAccess ? "block" : "none";
    }

    authItem.replaceChildren();

    if (user) {
        const logoutBtn = document.createElement("button");
        logoutBtn.type = "button";
        logoutBtn.className = "nav-btn btn-logout";
        logoutBtn.textContent = "Log out";

        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await logoutUser();
            } catch (err) {
                console.error("Logout error:", err);
            }
            clearUserCache();
            await updateNavbar();
            navigate("/");
        });

        authItem.appendChild(logoutBtn);
    } else {
        const loginLink = document.createElement("a");
        loginLink.href = "/auth/login";
        loginLink.setAttribute("data-link", "");
        loginLink.className = "nav-btn btn-login";
        loginLink.textContent = "Log in";

        authItem.appendChild(loginLink);
    }
}