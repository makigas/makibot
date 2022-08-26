-- Offsets exists to add extra points to members older than the karma system.
-- This was done manually long ago and the offset will match the total number
-- of sent messages before the datetime at which the karma system kicked in.
CREATE TABLE IF NOT EXISTS offsets (
    guild string,
    user string,
    offset integer
);