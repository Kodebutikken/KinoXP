CREATE DATABASE IF NOT EXISTS cinema;
USE cinema;

-- =========================================
-- 1. MOVIE
-- =========================================

CREATE TABLE movie
(
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(255),
    duration_minutes INT         NOT NULL,
    age_limit        INT         NOT NULL,
    description      VARCHAR(255),
    movie_genre      VARCHAR(50), -- MovieGenre enum name (EnumType.STRING)
    cover_url        VARCHAR(255),
    active           BOOLEAN     NOT NULL
);

-- =========================================
-- 2. THEATER
-- =========================================

CREATE TABLE theater
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255),
    row_count     INT NOT NULL,
    seats_per_row INT NOT NULL
);

-- =========================================
-- 3. SEAT
-- =========================================

CREATE TABLE seat
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    theater_id  BIGINT NOT NULL,
    seat_row    INT    NOT NULL,
    seat_number INT    NOT NULL,

    FOREIGN KEY (theater_id) REFERENCES theater (id) ON DELETE CASCADE,
    UNIQUE (theater_id, seat_row, seat_number)
);

-- =========================================
-- 4. EMPLOYEE
-- =========================================

CREATE TABLE employee
(
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(255),
    role     VARCHAR(50)  NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL UNIQUE
);

-- =========================================
-- 5. CUSTOMER
-- =========================================

CREATE TABLE customer
(
    id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255)
);

-- =========================================
-- 6. SHOWING
-- =========================================

CREATE TABLE showing
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id   BIGINT   NOT NULL,
    theater_id BIGINT   NOT NULL,
    start_time DATETIME(6),
    is_extra   BOOLEAN  NOT NULL DEFAULT FALSE,

    FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE,
    -- No cascade on Showing.theater: a theater with showings cannot be deleted
    FOREIGN KEY (theater_id) REFERENCES theater (id)
);

-- =========================================
-- 7. RESERVATION
-- =========================================

CREATE TABLE reservation
(
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    showing_id   BIGINT      NOT NULL,
    customer_id  BIGINT      NOT NULL,
    created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    is_paid      BOOLEAN     NOT NULL DEFAULT FALSE,
    order_number BIGINT      NOT NULL UNIQUE,

    FOREIGN KEY (showing_id) REFERENCES showing (id) ON DELETE CASCADE,
    -- No cascade on Customer.reservations: a customer with reservations cannot be deleted
    FOREIGN KEY (customer_id) REFERENCES customer (id)
);

-- =========================================
-- 8. RESERVATION_SEAT
-- =========================================

CREATE TABLE reservation_seat
(
    reservation_id BIGINT NOT NULL,
    seat_id        BIGINT NOT NULL,
    showing_id     BIGINT NOT NULL,

    PRIMARY KEY (reservation_id, seat_id),
    FOREIGN KEY (reservation_id) REFERENCES reservation (id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seat (id) ON DELETE CASCADE,
    FOREIGN KEY (showing_id) REFERENCES showing (id) ON DELETE CASCADE,
    -- A seat can only be reserved once per showing
    UNIQUE (showing_id, seat_id)
);
