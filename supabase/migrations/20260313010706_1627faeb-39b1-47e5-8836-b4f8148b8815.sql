-- Clear lat/lng for addresses with business names as city so they get re-geocoded
UPDATE delivery_addresses
SET lat = NULL, lng = NULL
WHERE city IN (
  SELECT name FROM units
)
AND lat IS NULL;