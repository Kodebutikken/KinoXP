"use strict";

import {loginUser} from "../api/kinoApi.js";
import {navigate} from "../router.js";
import {clearUserCache, updateNavbar} from "../components/navbar.js";

export async function createLoginView() {
    const container = document.createElement("div");
    container.classList.add("login-view");

    const title = document.createElement("h1");
    title.textContent = "Login";
    container.appendChild(title);

    const loginForm = document.createElement("form");
    loginForm.classList.add("login-form");

    const usernameLabel = document.createElement("label");
    usernameLabel.textContent = "Username:";
    const usernameInput = document.createElement("input");
    usernameInput.type = "text";
    usernameInput.name = "username";
    usernameInput.required = true;
    usernameLabel.appendChild(usernameInput);
    loginForm.appendChild(usernameLabel);

    const passwordLabel = document.createElement("label");
    passwordLabel.textContent = "Password:";
    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.name = "password";
    passwordInput.required = true;
    passwordLabel.appendChild(passwordInput);
    loginForm.appendChild(passwordLabel);

    const errorMessage = document.createElement("p");
    errorMessage.classList.add("error-message");
    errorMessage.style.color = "red";
    errorMessage.style.display = "none";
    loginForm.appendChild(errorMessage);

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Login";
    loginForm.appendChild(submitButton);

    submitButton.addEventListener("click", async (event) => {
        event.preventDefault();
        errorMessage.style.display = "none";

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if(!username || !password) {
            return;
        }

        try {
            const user = await loginUser({ username, password });

            if(user.role === "ADMINISTRATOR") {

                clearUserCache();
                await updateNavbar();
                navigate("/admin");
            } else {
                navigate("/");
            }

        } catch (error) {
            errorMessage.textContent = "Invalid username or password.";
            errorMessage.style.display = "block";
        }
    });

    container.appendChild(loginForm);

    return container;
}