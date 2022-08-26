-- The transactions is a subset view of the karma that picks the bounties and
-- makes some checks and balances with them. No more than 300 points should
-- be granted by day. Therefore, the bounties are grouped by day and only the
-- first 300 points are taken into consideration when bountying to someone.
-- This cannot be done with a SUM() by day, because we also need to know who
-- received the bounty, and the order matters. The following CTEs are in use:
--
-- * bounties: the raw list of bounty events (when someone receives karma).
-- * balances: how many points were already sent by this person today before
--   counting the current transaction (the current transaction does not count).
-- * cleared: compute the value column, which considers the remaining points
--   awardable today and coerces the points given by this number.
CREATE VIEW IF NOT EXISTS transactions AS
    WITH bounties AS (
SELECT
	actor_id AS interaction,
	datetime,
	originator_id AS send,
	target_id AS receive,
	points
FROM
	karma
WHERE
	kind = 'bounty'
ORDER BY
	interaction ASC
    ),
    balances AS (
SELECT
	date(b.datetime),
	b.datetime,
	b.send,
	b.receive,
	b.points,
	(
	SELECT
		COALESCE(sum(points),
		0)
	FROM
		bounties
	WHERE
		date(datetime) = date(b.datetime)
			AND send = b.send
			AND interaction < b.interaction 
      ) AS today
FROM
	bounties b
ORDER BY
	date(datetime),
	send
    ),
    cleared AS (
SELECT
	b.datetime,
	b.send,
	b.receive,
	(300 - b.today) AS pending,
	b.points,
	(CASE
		WHEN b.points < (300 - b.today) THEN b.points
		ELSE max(0, 300 - b.today)
	END
        ) AS value
FROM
	balances b
    )
    SELECT
	c.datetime,
	c.send,
	c.receive,
	c.value
FROM
	cleared c;