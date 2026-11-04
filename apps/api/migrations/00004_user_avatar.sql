-- +goose Up
-- Object-store key of the user's processed avatar (256×256 JPEG). A new key per upload
-- lets the image be cached forever; NULL means "show initials".
ALTER TABLE users ADD COLUMN avatar_key text CHECK (avatar_key ~ '^[a-z0-9/_.-]{1,128}$');

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS avatar_key;
