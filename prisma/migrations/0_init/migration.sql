-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- After Prisma creates tables, add trigram index for catalog number search
-- This will be applied via a separate step or post-migration hook
