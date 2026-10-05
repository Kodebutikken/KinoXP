CREATE DATABASE IF NOT EXISTS cinema;
USE cinema;

-- =========================================
-- 1. CATEGORY
-- =========================================

CREATE TABLE category
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- =========================================
-- 2. MOVIE
-- =========================================

CREATE TABLE movie
(
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    duration_minutes INT          NOT NULL,
    age_limit        INT          NOT NULL,
    description      TEXT,
    active           BOOLEAN      NOT NULL DEFAULT TRUE
);

-- =========================================
-- 3. MOVIE_CATEGORY (M:N)
-- =========================================

CREATE TABLE movie_category
(
    movie_id    BIGINT NOT NULL,
    category_id BIGINT NOT NULL,

    PRIMARY KEY (movie_id, category_id),
    FOREIGN KEY (movie_id) REFERENCES movie (id),
    FOREIGN KEY (category_id) REFERENCES category (id)
);

-- =========================================
-- 4. THEATER
-- =========================================

CREATE TABLE theater
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    row_count     INT          NOT NULL,
    seats_per_row INT          NOT NULL
);

-- =========================================
-- 5. SEAT
-- =========================================

CREATE TABLE seat
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    theater_id  BIGINT NOT NULL,
    seat_row    INT  NOT NULL,
    seat_number INT  NOT NULL,

    FOREIGN KEY (theater_id) REFERENCES theater (id),
    UNIQUE (theater_id, seat_row, seat_number)
);

-- =========================================
-- 6. EMPLOYEE
-- =========================================

CREATE TABLE employee
(
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL
);

-- =========================================
-- 7. CUSTOMER
-- =========================================

CREATE TABLE customer
(
    id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255)
);

-- =========================================
-- 8. SHOWING
-- =========================================

CREATE TABLE showing
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id   BIGINT        NOT NULL,
    theater_id BIGINT        NOT NULL,
    start_time DATETIME        NOT NULL,
    is_extra   BOOLEAN     NOT NULL DEFAULT FALSE,

    FOREIGN KEY (movie_id) REFERENCES movie (id),
    FOREIGN KEY (theater_id)  REFERENCES theater (id)
);

-- =========================================
-- 9. RESERVATION
-- =========================================

CREATE TABLE reservation
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT        NOT NULL,
    showing_id   BIGINT        NOT NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_paid      BOOLEAN     DEFAULT FALSE,

    FOREIGN KEY (customer_id) REFERENCES customer (id),
    FOREIGN KEY (showing_id) REFERENCES showing (id)
);


CREATE TABLE reservation_seat
(
    reservation_id BIGINT NOT NULL,
    seat_id        BIGINT NOT NULL,
    showing_id     BIGINT NOT NULL,

    PRIMARY KEY (reservation_id, seat_id),
    FOREIGN KEY (reservation_id) REFERENCES reservation (id),
    FOREIGN KEY (seat_id) REFERENCES seat (id),
    FOREIGN KEY (showing_id) REFERENCES showing (id)
);

-- =========================================
-- 10. TICKET
-- =========================================

CREATE TABLE ticket
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT           NOT NULL,
    showing_id     BIGINT           NOT NULL,
    seat_id        BIGINT           NOT NULL,
    employee_id    BIGINT           NOT NULL,
    price          DECIMAL(10, 2) NOT NULL,

    FOREIGN KEY (reservation_id) REFERENCES reservation (id),
    FOREIGN KEY (showing_id) REFERENCES showing (id),
    FOREIGN KEY (seat_id) REFERENCES seat (id),
    FOREIGN KEY (employee_id) REFERENCES employee (id),
    -- A seat can only be sold once per showing
    UNIQUE (showing_id, seat_id)
);