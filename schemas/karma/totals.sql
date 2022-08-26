-- Totals will compute the total amount of points for each target_id. It
-- gathers and sums data from the histogram, the transactions log and the
-- offsets, and it sums all the values to compute the final score.
--
-- Uses the following CTEs:
-- * sent: the total amount of points sent by each user in transactions
-- * received: the total amount of points received by each user in transactions
-- * partials: collects data from histogram, sent, received and offsets;
--   the histogram is trasposed (so each row of the histogram becomes a column)
CREATE VIEW IF NOT EXISTS totals AS
WITH sent AS (
SELECT
	send AS target_id,
	sum(value) AS total
FROM
	transactions
GROUP BY
	send
),
received AS (
SELECT
	receive AS target_id,
	sum(value) AS total
FROM
	transactions
GROUP BY
	receive
),
partials AS (
SELECT
	h.target_id,
	COALESCE((
	SELECT
		o.offset
	FROM
		offsets o
	WHERE
		o.USER = h.target_id),
	0) AS OFFSET,
	COALESCE((
	SELECT
		s.total
	FROM
		sent s
	WHERE
		s.target_id = h.target_id),
	0)*-1 AS sent,
	COALESCE((
	SELECT
		r.total
	FROM
		received r
	WHERE
		r.target_id = h.target_id),
	0) AS received,
	sum(CASE WHEN h.kind = 'message' THEN h.points ELSE 0 END) AS messages,
	sum(CASE WHEN h.kind = 'wave' THEN h.points ELSE 0 END) AS waves,
	sum(CASE WHEN h.kind = 'upvote' THEN h.points ELSE 0 END) AS upvotes,
	sum(CASE WHEN h.kind = 'downvote' THEN h.points ELSE 0 END) AS downvotes,
	sum(CASE WHEN h.kind = 'heart' THEN h.points ELSE 0 END) AS hearts,
	sum(CASE WHEN h.kind = 'star' THEN h.points ELSE 0 END) AS stars,
	sum(CASE WHEN h.kind = 'loot' THEN h.points ELSE 0 END) AS loots
FROM
	histogram h
GROUP BY
	target_id
)
SELECT
	target_id,
	OFFSET + messages + waves + upvotes + downvotes + hearts + stars + loots + sent + received AS total,
	OFFSET,
	messages,
	waves,
	upvotes,
	downvotes,
	hearts,
	stars,
	loots,
	sent,
	received
FROM
	partials
ORDER BY
	total DESC;