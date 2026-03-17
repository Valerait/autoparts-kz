-- =============================================================================
-- POST-MIGRATION: Trigram indexes and full-text search setup
-- Run after prisma migrate: psql $DATABASE_URL -f scripts/post-migrate.sql
-- =============================================================================

-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index on normalized catalog numbers for fuzzy search
CREATE INDEX IF NOT EXISTS idx_catalog_number_trgm
  ON "CatalogNumber" USING gin ("normalizedNumber" gin_trgm_ops);

-- Trigram index on original numbers
CREATE INDEX IF NOT EXISTS idx_catalog_number_original_trgm
  ON "CatalogNumber" USING gin ("originalNumber" gin_trgm_ops);

-- Full-text search index on product name
CREATE INDEX IF NOT EXISTS idx_product_name_trgm
  ON "Product" USING gin ("name" gin_trgm_ops);

-- Composite index for product listing queries
CREATE INDEX IF NOT EXISTS idx_product_active_brand_cat
  ON "Product" ("isActive", "brandId", "categoryId");
