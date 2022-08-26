-- The histogram groups the total amount of points of a kind received by
-- someone at some specific date. The bounties are specifically kept out
-- since there are some transaction balances that must be checked separately.
CREATE VIEW IF NOT EXISTS histogram AS
SELECT
	date(datetime) AS DAY,
	target_id,
	kind,
	sum(points) AS points
FROM
	karma
WHERE
	kind NOT IN ('bounty', 'bounty-send')
GROUP BY
	date(datetime),
	target_id,
	kind
ORDER BY
	DAY DESC;