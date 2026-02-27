-- ClaimIQ: Supabase RPC function for vector similarity search
-- Run this in Supabase SQL Editor AFTER creating the main schema

CREATE OR REPLACE FUNCTION match_fraud_embeddings(
    query_embedding VECTOR(512),
    similarity_threshold FLOAT DEFAULT 0.92,
    match_count INT DEFAULT 1,
    exclude_claim UUID DEFAULT NULL
)
RETURNS TABLE (
    claim_id UUID,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fh.claim_id,        
        1 - (fh.image_embedding <=> query_embedding) AS similarity
    FROM fraud_history fh
    WHERE fh.claim_id != COALESCE(exclude_claim, '00000000-0000-0000-0000-000000000000'::UUID)
    AND 1 - (fh.image_embedding <=> query_embedding) > similarity_threshold
    ORDER BY fh.image_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
