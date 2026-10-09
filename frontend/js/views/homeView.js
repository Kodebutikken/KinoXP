"use strict";

import { fetchMovies, fetchShowings } from "../api/kinoApi.js";
import { navigate } from "../router.js";
import { createPoster, posterHue, movieMeta, formatGenre, formatTime } from "../components/poster.js";

const HERO_INTERVAL_MS = 7000;
const MAX_PROGRAM_DAYS = 7;

export async function createHomeView() {
    const container = document.createElement("section");
    container.className = "home-page";

    let movies;
    try {
        movies = await fetchMovies();
    } catch (error) {
        console.error("Error while loading home view:", error);
        const alertNode = document.createElement("p");
        alertNode.className = "error";
        alertNode.textContent = "Error while loading movies.";
        container.appendChild(alertNode);
        return container;
    }

    const activeMovies = (movies || []).filter((movie) => movie.active);

    container.appendChild(createHero(selectRandomMovies(activeMovies, 3)));

    if (activeMovies.length === 0) {
        const noMoviesNode = document.createElement("p");
        noMoviesNode.className = "home-empty";
        noMoviesNode.textContent = "No movies available right now. Check back soon!";
        container.appendChild(noMoviesNode);
        container.appendChild(createFooter());
        return container;
    }

    const showings = await loadShowings(activeMovies);

    container.appendChild(createQuickBooking(activeMovies));
    container.appendChild(createPosterRow(activeMovies));
    container.appendChild(createPromoBanner());
    container.appendChild(createProgram(activeMovies, showings));
    container.appendChild(createInfoSection());
    container.appendChild(createFooter());

    return container;
}

/* ---------- Data ---------- */

function selectRandomMovies(movies, count) {
    const shuffledMovies = [...movies];

    for (let index = shuffledMovies.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledMovies[index], shuffledMovies[randomIndex]] = [
            shuffledMovies[randomIndex],
            shuffledMovies[index],
        ];
    }

    return shuffledMovies.slice(0, count);
}

async function loadShowings(movies) {
    const results = await Promise.allSettled(
        movies.map((movie) => fetchShowings(movie.id))
    );

    const now = new Date();
    return results
        .filter((result) => result.status === "fulfilled" && Array.isArray(result.value))
        .flatMap((result) => result.value)
        .map((showing) => ({ ...showing, start: new Date(showing.startTime) }))
        .filter((showing) => showing.start >= now)
        .sort((a, b) => a.start - b.start);
}

/* ---------- Hero ---------- */

function createHero(featuredMovies) {
    const hero = document.createElement("div");
    hero.className = "home-hero";

    if (featuredMovies.length === 0) {
        hero.appendChild(createHeroSlide(null));
        hero.firstElementChild.classList.add("active");
        return hero;
    }

    const slides = featuredMovies.map(createHeroSlide);
    hero.append(...slides);

    if (slides.length > 1) {
        const dots = document.createElement("div");
        dots.className = "home-hero-dots";

        let current = Math.floor(Math.random() * slides.length);
        slides[current].classList.add("active");
        const show = (index) => {
            slides[current].classList.remove("active");
            dots.children[current].classList.remove("active");
            current = index;
            slides[current].classList.add("active");
            dots.children[current].classList.add("active");
        };

        slides.forEach((slide, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "home-hero-dot";
            dot.setAttribute("aria-label", `Show ${featuredMovies[index].title}`);
            dot.addEventListener("click", () => show(index));
            dots.appendChild(dot);
        });
        dots.children[current].classList.add("active");
        hero.appendChild(dots);

        // Stopper automatisk, når man navigerer væk fra forsiden
        const timer = setInterval(() => {
            if (!hero.isConnected) {
                clearInterval(timer);
                return;
            }
            show((current + 1) % slides.length);
        }, HERO_INTERVAL_MS);
    } else {
        slides[0].classList.add("active");
    }

    return hero;
}

function createHeroSlide(movie) {
    const template = document.createElement("template");
    template.innerHTML = `
    <article class="home-hero-slide">
        <div class="home-hero-content">
            <p class="home-eyebrow"></p>
            <h1 class="home-hero-title"></h1>
            <p class="home-hero-meta"></p>
            <p class="home-hero-description"></p>
            <div class="home-hero-actions">
                <a class="btn-primary home-hero-cta" data-link></a>
                <a class="home-hero-link" href="/movies" data-link>All movies</a>
            </div>
        </div>
        <div class="home-hero-poster"></div>
    </article>
    `;

    const slide = template.content.firstElementChild.cloneNode(true);
    const primary = slide.querySelector(".home-hero-cta");

    if (!movie) {
        slide.querySelector(".home-eyebrow").textContent = "Welcome to";
        slide.querySelector(".home-hero-title").textContent = "KinoXP";
        slide.querySelector(".home-hero-description").textContent =
            "Two theaters, proper sound and the newest releases. Book your seats online in under a minute.";
        primary.textContent = "See the program";
        primary.href = "/movies";
        slide.querySelector(".home-hero-poster").remove();
        return slide;
    }

    const hue = posterHue(movie.id);
    slide.style.setProperty("--hue", hue);

    slide.querySelector(".home-eyebrow").textContent = "Now showing";
    slide.querySelector(".home-hero-title").textContent = movie.title || "Untitled";
    slide.querySelector(".home-hero-meta").textContent = movieMeta(movie);
    slide.querySelector(".home-hero-description").textContent = movie.description || "";
    primary.textContent = "Reserve tickets";
    primary.href = `/movies/${movie.id}/showings`;
    slide.querySelector(".home-hero-poster").appendChild(createPoster(movie));

    return slide;
}

/* ---------- Plan your visit ---------- */

function createQuickBooking(movies) {
    const template = document.createElement("template");
    template.innerHTML = `
    <form class="home-quick">
        <h2 class="home-quick-title">Plan your visit</h2>
        <select class="home-quick-select" aria-label="Choose a movie">
            <option value="">Choose a movie</option>
        </select>
        <button type="submit" class="btn-primary" disabled>Find showings</button>
    </form>
    `;

    const form = template.content.firstElementChild.cloneNode(true);
    const select = form.querySelector("select");
    const button = form.querySelector("button");

    movies.forEach((movie) => {
        const option = document.createElement("option");
        option.value = movie.id;
        option.textContent = movie.title || "Untitled";
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        button.disabled = !select.value;
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (select.value) {
            navigate(`/movies/${encodeURIComponent(select.value)}/showings`);
        }
    });

    return form;
}

/* ---------- Poster row ---------- */

function createPosterRow(movies) {
    const section = document.createElement("section");
    section.className = "home-section home-posters";

    const header = createSectionHeader("Now showing", "/movies", "See all movies");
    section.appendChild(header);

    const track = document.createElement("div");
    track.className = "home-poster-track";

    movies.forEach((movie) => {
        const template = document.createElement("template");
        template.innerHTML = `
        <a class="home-poster-card" data-link>
            <div class="home-poster-frame"></div>
            <h3 class="home-poster-title"></h3>
            <p class="home-poster-genre"></p>
        </a>
        `;

        const card = template.content.firstElementChild.cloneNode(true);
        card.href = `/movies/${movie.id}/showings`;
        card.querySelector(".home-poster-frame").appendChild(createPoster(movie));
        card.querySelector(".home-poster-title").textContent = movie.title || "Untitled";
        card.querySelector(".home-poster-genre").textContent = formatGenre(movie.movieGenre);
        track.appendChild(card);
    });

    const prev = createScrollButton("prev", "Scroll left", track, -1);
    const next = createScrollButton("next", "Scroll right", track, 1);

    const wrapper = document.createElement("div");
    wrapper.className = "home-poster-wrapper";
    wrapper.append(prev, track, next);
    section.appendChild(wrapper);

    return section;
}

function createScrollButton(modifier, label, track, direction) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `home-scroll-btn home-scroll-${modifier}`;
    button.setAttribute("aria-label", label);
    button.textContent = direction < 0 ? "‹" : "›";
    button.addEventListener("click", () => {
        track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
    });
    return button;
}

/* ---------- Promo banner ---------- */

function createPromoBanner() {
    const template = document.createElement("template");
    template.innerHTML = `
    <a class="home-promo" href="/cancel" data-link>
        <div>
            <p class="home-promo-kicker">Plans changed?</p>
            <h2 class="home-promo-title">Cancel your tickets online</h2>
            <p class="home-promo-text">All you need is your order number and e-mail.</p>
        </div>
        <span class="btn-primary">Cancel tickets</span>
    </a>
    `;
    return template.content.firstElementChild.cloneNode(true);
}

/* ---------- Program ---------- */

function createProgram(movies, showings) {
    const section = document.createElement("section");
    section.className = "home-section home-program";
    section.appendChild(createSectionHeader("Program"));

    if (showings.length === 0) {
        const empty = document.createElement("p");
        empty.className = "home-empty";
        empty.textContent = "No upcoming showings yet.";
        section.appendChild(empty);
        return section;
    }

    const byDay = new Map();
    showings.forEach((showing) => {
        const key = dayKey(showing.start);
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(showing);
    });

    const days = [...byDay.keys()].slice(0, MAX_PROGRAM_DAYS);
    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));

    const tabs = document.createElement("div");
    tabs.className = "home-day-tabs";
    tabs.setAttribute("role", "tablist");

    const list = document.createElement("div");
    list.className = "home-program-list";

    const selectDay = (key) => {
        [...tabs.children].forEach((tab) => {
            const isActive = tab.dataset.day === key;
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
        });
        list.replaceChildren(...renderProgramDay(byDay.get(key), moviesById));
    };

    days.forEach((key) => {
        const date = byDay.get(key)[0].start;
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "home-day-tab";
        tab.dataset.day = key;
        tab.setAttribute("role", "tab");

        const weekday = document.createElement("span");
        weekday.className = "home-day-weekday";
        weekday.textContent = isToday(date)
            ? "Today"
            : date.toLocaleDateString("en-GB", { weekday: "short" });

        const dayNumber = document.createElement("span");
        dayNumber.className = "home-day-number";
        dayNumber.textContent = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

        tab.append(weekday, dayNumber);
        tab.addEventListener("click", () => selectDay(key));
        tabs.appendChild(tab);
    });

    section.append(tabs, list);
    selectDay(days[0]);

    return section;
}

function renderProgramDay(dayShowings, moviesById) {
    const byMovie = new Map();
    dayShowings.forEach((showing) => {
        if (!byMovie.has(showing.movieId)) byMovie.set(showing.movieId, []);
        byMovie.get(showing.movieId).push(showing);
    });

    return [...byMovie.entries()].map(([movieId, movieShowings]) => {
        const movie = moviesById.get(movieId) || { id: movieId, title: movieShowings[0].movieTitle };

        const template = document.createElement("template");
        template.innerHTML = `
        <article class="home-program-row">
            <a class="home-program-poster" data-link></a>
            <div class="home-program-body">
                <h3 class="home-program-title"><a data-link></a></h3>
                <p class="home-program-meta"></p>
                <p class="home-program-description"></p>
                <div class="time-list"></div>
            </div>
        </article>
        `;

        const row = template.content.firstElementChild.cloneNode(true);
        const showingsHref = `/movies/${movie.id}/showings`;

        const posterLink = row.querySelector(".home-program-poster");
        posterLink.href = showingsHref;
        posterLink.appendChild(createPoster(movie));

        const titleLink = row.querySelector(".home-program-title a");
        titleLink.href = showingsHref;
        titleLink.textContent = movie.title || "Untitled";

        row.querySelector(".home-program-meta").textContent = movieMeta(movie);
        row.querySelector(".home-program-description").textContent = movie.description || "";

        const times = row.querySelector(".time-list");
        movieShowings.forEach((showing) => {
            const chip = document.createElement("a");
            chip.className = "time-chip";
            chip.href = `/showings/${showing.id}/book`;
            chip.setAttribute("data-link", "");

            const time = document.createElement("span");
            time.className = "time-chip-time";
            time.textContent = formatTime(showing.start);

            const theater = document.createElement("span");
            theater.className = "time-chip-theater";
            theater.textContent = showing.theaterName || "";

            chip.append(time, theater);
            times.appendChild(chip);
        });

        return row;
    });
}

/* ---------- Info + footer ---------- */

function createInfoSection() {
    const section = document.createElement("section");
    section.className = "home-section home-info";

    const intro = document.createElement("div");
    intro.className = "home-info-intro";
    const heading = document.createElement("h2");
    heading.textContent = "Good to know";
    const lead = document.createElement("p");
    lead.textContent = "Everything you need before your visit, from booking to changing your plans.";
    intro.append(heading, lead);

    const items = [
        { title: "Book your seats online", text: "Choose a showing, pick your seats and get an order number straight away.", href: "/movies", link: "Browse movies" },
        { title: "Two theaters", text: "A large theater for the big releases and a smaller one for a cozier evening.", href: "/movies", link: "See the program" },
        { title: "Cancel up to 24 hours before", text: "Unpaid tickets can be cancelled online with your order number and e-mail.", href: "/cancel", link: "Cancel tickets" },
    ];

    const list = document.createElement("ol");
    list.className = "home-info-list";

    items.forEach((item, index) => {
        const template = document.createElement("template");
        template.innerHTML = `
        <li class="home-info-item">
            <span class="home-info-number"></span>
            <div>
                <h3></h3>
                <p></p>
                <a data-link></a>
            </div>
        </li>
        `;
        const row = template.content.firstElementChild.cloneNode(true);
        row.querySelector(".home-info-number").textContent = String(index + 1).padStart(2, "0");
        row.querySelector("h3").textContent = item.title;
        row.querySelector("p").textContent = item.text;
        const link = row.querySelector("a");
        link.href = item.href;
        link.textContent = item.link;
        list.appendChild(row);
    });

    section.append(intro, list);
    return section;
}

function createFooter() {
    const template = document.createElement("template");
    template.innerHTML = `
    <footer class="home-footer">
        <div class="home-footer-inner">
            <div>
                <p class="home-footer-brand">Kino<span>XP</span></p>
                <p class="home-footer-text">Movies, popcorn and good company.</p>
            </div>
            <nav class="home-footer-links" aria-label="Footer">
                <a href="/movies" data-link>Current Movies</a>
                <a href="/cancel" data-link>Cancel Tickets</a>
                <a href="/auth/login" data-link>Staff login</a>
            </nav>
        </div>
        <p class="home-footer-copy"></p>
    </footer>
    `;
    const footer = template.content.firstElementChild.cloneNode(true);
    footer.querySelector(".home-footer-copy").textContent = `© ${new Date().getFullYear()} KinoXP`;
    return footer;
}

/* ---------- Helpers ---------- */

function createSectionHeader(title, href, linkText) {
    const header = document.createElement("div");
    header.className = "home-section-header";

    const heading = document.createElement("h2");
    heading.textContent = title;
    header.appendChild(heading);

    if (href) {
        const link = document.createElement("a");
        link.className = "see-all-link";
        link.href = href;
        link.setAttribute("data-link", "");
        link.textContent = linkText;
        header.appendChild(link);
    }

    return header;
}

function dayKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function isToday(date) {
    return dayKey(date) === dayKey(new Date());
}
