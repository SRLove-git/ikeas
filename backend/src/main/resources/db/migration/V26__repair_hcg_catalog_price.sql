-- Keep the live HCG catalog price aligned with the CMS value. Existing orders
-- intentionally retain their historical order_item/unit_price snapshots.

UPDATE product
SET payload = jsonb_set(payload, '{price}', to_jsonb(0.01::numeric), true),
    version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE product_id = '8885020710595'
  AND deleted = 0;

UPDATE catalog_category AS category
SET payload = jsonb_set(
        category.payload,
        '{products}',
        (
            SELECT COALESCE(
                jsonb_agg(
                    CASE
                        WHEN item ->> 'id' = '8885020710595'
                            THEN jsonb_set(item, '{price}', to_jsonb(0.01::numeric), true)
                        ELSE item
                    END
                    ORDER BY position
                ),
                '[]'::jsonb
            )
            FROM jsonb_array_elements(
                CASE
                    WHEN jsonb_typeof(category.payload -> 'products') = 'array'
                        THEN category.payload -> 'products'
                    ELSE '[]'::jsonb
                END
            ) WITH ORDINALITY AS products(item, position)
        ),
        true
    ),
    version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE category.deleted = 0
  AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
          CASE
              WHEN jsonb_typeof(category.payload -> 'products') = 'array'
                  THEN category.payload -> 'products'
              ELSE '[]'::jsonb
          END
      ) AS products(item)
      WHERE item ->> 'id' = '8885020710595'
  );

UPDATE catalog_page AS page
SET payload = jsonb_set(
        page.payload,
        '{products}',
        (
            SELECT COALESCE(
                jsonb_agg(
                    CASE
                        WHEN item ->> 'id' = '8885020710595'
                            THEN jsonb_set(item, '{price}', to_jsonb(0.01::numeric), true)
                        ELSE item
                    END
                    ORDER BY position
                ),
                '[]'::jsonb
            )
            FROM jsonb_array_elements(
                CASE
                    WHEN jsonb_typeof(page.payload -> 'products') = 'array'
                        THEN page.payload -> 'products'
                    ELSE '[]'::jsonb
                END
            ) WITH ORDINALITY AS products(item, position)
        ),
        true
    ),
    version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE page.deleted = 0
  AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
          CASE
              WHEN jsonb_typeof(page.payload -> 'products') = 'array'
                  THEN page.payload -> 'products'
              ELSE '[]'::jsonb
          END
      ) AS products(item)
      WHERE item ->> 'id' = '8885020710595'
  );
