-- Database-level invariants (docs/plan.md section 3). Prisma cannot express CHECK
-- constraints in the schema and ignores them during drift detection, so they live here.
-- Stock never goes negative even if a service-level guard is bypassed.
ALTER TABLE "vehicles"  ADD CONSTRAINT "vehicles_quantity_nonnegative" CHECK ("quantity" >= 0);
ALTER TABLE "vehicles"  ADD CONSTRAINT "vehicles_price_nonnegative"    CHECK ("price_cents" >= 0);
ALTER TABLE "vehicles"  ADD CONSTRAINT "vehicles_year_range"           CHECK ("year" BETWEEN 1886 AND 2100);
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_quantity_positive"   CHECK ("quantity" > 0);
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_unit_price_nonneg"   CHECK ("unit_price_cents" >= 0);
