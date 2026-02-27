from typing import Optional
from app.db.supabase_client import get_supabase_client
from app.utils.logger import logger
import time


class CostRepository:
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "cost_table"
        self._cache: dict = {}
        self._cache_time: float = 0
        self._cache_ttl: float = 600  # 10 minutes

    async def get_by_zone(self, zone_name: str) -> dict | None:
        """Get cost data for a zone, with in-memory caching."""
        now = time.time()

        # Refresh cache if expired
        if not self._cache or (now - self._cache_time > self._cache_ttl):
            await self._refresh_cache()

        return self._cache.get(zone_name)

    async def get_all(self) -> list:
        """Get all cost table entries."""
        now = time.time()
        if not self._cache or (now - self._cache_time > self._cache_ttl):
            await self._refresh_cache()
        return list(self._cache.values())

    async def _refresh_cache(self) -> None:
        response = self.client.table(self.table).select("*").execute()
        self._cache = {row["zone_name"]: row for row in response.data}
        self._cache_time = time.time()
        logger.info(f"Cost table cache refreshed: {len(self._cache)} zones loaded")

    # Fallback defaults if zone not in DB
    FALLBACK = {
        "minor_cost": 4000,
        "moderate_cost": 13000,
        "severe_cost": 30000,
        "labor_cost": 2000,
        "regional_multiplier": 1.0,
    }

    async def get_by_zone_or_default(self, zone_name: str) -> dict:
        result = await self.get_by_zone(zone_name)
        if result:
            return result
        logger.warning(f"Zone '{zone_name}' not in cost_table, using fallback")
        return self.FALLBACK
