-- This table will hold one entry per karma action and it is the raw table
-- with all the events ingested by the system. Everytime something happens,
-- it must be added to the table.
CREATE TABLE IF NOT EXISTS karma (
    actor_id INTEGER NOT NULL,
    actor_type VARCHAR(32) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    originator_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    datetime DATETIME NOT NULL,
    points INTEGER NOT NULL,
    PRIMARY KEY (actor_id, kind, originator_id, target_id)
);