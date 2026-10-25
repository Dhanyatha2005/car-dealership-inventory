-- Runs once, when the Postgres data volume is first initialised.
-- kata_dev is created by POSTGRES_DB; these are the isolated test databases.
-- kata_test: API integration tests (truncated between tests).
-- kata_e2e: Playwright end-to-end runs (reset and seeded in global setup).
CREATE DATABASE kata_test OWNER kata;
CREATE DATABASE kata_e2e OWNER kata;
