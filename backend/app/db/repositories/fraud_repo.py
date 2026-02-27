from typing import Optional, List
from app.db.supabase_client import get_supabase_client
from app.utils.logger import logger


class FraudRepository:
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "fraud_history"

    async def store_embedding(
        self,
        claim_id: str,
        embedding: List[float],
        similarity_score: float = 0.0,
        matched_claim_id: Optional[str] = None,
    ) -> None:
        data = {
            "claim_id": claim_id,
            "image_embedding": embedding,
            "similarity_score": similarity_score,
            "matched_claim_id": matched_claim_id,
        }
        self.client.table(self.table).insert(data).execute()
        logger.info(f"Fraud embedding stored for claim {claim_id}")

    async def find_similar_embedding(
        self,
        embedding: List[float],
        threshold: float = 0.92,
        exclude_claim_id: Optional[str] = None,
    ) -> dict | None:
        """
        Find the most similar embedding using pgvector cosine similarity.
        Uses a Supabase RPC function for vector search.
        """
        try:
            response = self.client.rpc(
                "match_fraud_embeddings",
                {
                    "query_embedding": embedding,
                    "similarity_threshold": threshold,
                    "match_count": 1,
                    "exclude_claim": exclude_claim_id,
                },
            ).execute()

            if response.data and len(response.data) > 0:
                match = response.data[0]
                logger.info(
                    f"Fraud match found: claim {match['claim_id']} "
                    f"(similarity: {match['similarity']:.4f})"
                )
                return {
                    "claim_id": match["claim_id"],
                    "similarity": match["similarity"],
                }
        except Exception as e:
            logger.warning(f"Vector similarity search failed: {e}")

        return None

    async def get_by_claim(self, claim_id: str) -> List[dict]:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("claim_id", claim_id)
            .execute()
        )
        return response.data
