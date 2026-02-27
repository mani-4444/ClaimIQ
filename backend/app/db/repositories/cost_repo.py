from typing import Optional
from pathlib import Path
import csv
from app.db.supabase_client import get_supabase_client
from app.utils.logger import logger
import time


class CostRepository:
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "cost_table"
        self.pricing_table = "car_damage_pricing"
        self._cache: dict = {}
        self._cache_time: float = 0
        self._cache_ttl: float = 600  # 10 minutes
        self._damage_type_cache: dict[str, int] = {}
        self._damage_type_cache_time: float = 0
        self._model_pricing_cache: dict[tuple[str, str, str], int] = {}
        self._brand_damage_cache: dict[tuple[str, str], int] = {}
        self._vehicle_options_cache: dict[str, list[str]] = {}
        self._pricing_table_available: bool = True

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

    @staticmethod
    def _normalize_damage_type(value: str | None) -> str:
        if not value:
            return ""
        normalized = value.strip().lower().replace("_", " ").replace("-", " ")
        normalized = " ".join(normalized.split())

        alias_map = {
            "broken headlight": "broken headlight/taillight",
            "broken taillight": "broken headlight/taillight",
            "headlight damage": "broken headlight/taillight",
            "taillight damage": "broken headlight/taillight",
            "broken windshield": "broken glass",
            "windshield crack": "broken glass",
            "glass crack": "broken glass",
            "bumper": "bumper damage",
        }
        return alias_map.get(normalized, normalized)

    @staticmethod
    def _normalize_vehicle_key(value: str | None) -> str:
        if not value:
            return ""
        return " ".join(str(value).strip().lower().split())

    async def _refresh_damage_type_cache(self) -> None:
        if not self._pricing_table_available:
            self._damage_type_cache = {}
            self._damage_type_cache_time = time.time()
            return

        try:
            response = self.client.table(self.pricing_table).select(
                "damage_type, estimated_repair_cost_inr"
            ).execute()
            grouped: dict[str, list[int]] = {}
            model_grouped: dict[tuple[str, str, str], list[int]] = {}
            brand_grouped: dict[tuple[str, str], list[int]] = {}
            vehicle_options: dict[str, set[str]] = {}
            for row in response.data or []:
                damage_type = self._normalize_damage_type(row.get("damage_type"))
                if not damage_type:
                    continue

                brand = str(row.get("brand") or "").strip()
                car_model = str(row.get("car_model") or "").strip()
                raw_cost = row.get("estimated_repair_cost_inr")
                try:
                    cost = int(raw_cost)
                except (TypeError, ValueError):
                    continue
                grouped.setdefault(damage_type, []).append(cost)

                if brand:
                    brand_key = self._normalize_vehicle_key(brand)
                    brand_grouped.setdefault((brand_key, damage_type), []).append(cost)
                    vehicle_options.setdefault(brand, set())

                    if car_model:
                        model_key = self._normalize_vehicle_key(car_model)
                        model_grouped.setdefault(
                            (brand_key, model_key, damage_type), []
                        ).append(cost)
                        vehicle_options[brand].add(car_model)

            self._damage_type_cache = {
                damage_type: round(sum(costs) / len(costs))
                for damage_type, costs in grouped.items()
                if costs
            }
            self._model_pricing_cache = {
                key: round(sum(costs) / len(costs))
                for key, costs in model_grouped.items()
                if costs
            }
            self._brand_damage_cache = {
                key: round(sum(costs) / len(costs))
                for key, costs in brand_grouped.items()
                if costs
            }
            self._vehicle_options_cache = {
                brand: sorted(models)
                for brand, models in vehicle_options.items()
            }

            if not self._model_pricing_cache:
                csv_defaults, csv_model_prices, csv_brand_prices = self._load_pricing_from_csv_fallback()
                if csv_defaults:
                    self._damage_type_cache = csv_defaults
                if csv_model_prices:
                    self._model_pricing_cache = csv_model_prices
                if csv_brand_prices:
                    self._brand_damage_cache = csv_brand_prices

            if not self._vehicle_options_cache:
                self._vehicle_options_cache = self._load_vehicle_options_from_csv_fallback()

            self._damage_type_cache_time = time.time()
            logger.info(
                "Damage pricing cache refreshed: "
                f"{len(self._model_pricing_cache)} model-level prices, "
                f"{len(self._brand_damage_cache)} brand-level prices, "
                f"{len(self._damage_type_cache)} damage-type defaults"
            )
        except Exception as e:
            self._pricing_table_available = False
            self._damage_type_cache = {}
            self._model_pricing_cache = {}
            self._brand_damage_cache = {}
            self._vehicle_options_cache = self._load_vehicle_options_from_csv_fallback()
            self._damage_type_cache_time = time.time()
            logger.warning(
                f"Pricing table '{self.pricing_table}' unavailable; falling back to zone costs only ({e})"
            )

    async def get_by_damage_type(
        self,
        damage_type: str | None,
        vehicle_company: str | None = None,
        vehicle_model: str | None = None,
    ) -> int | None:
        normalized = self._normalize_damage_type(damage_type)
        if not normalized:
            return None

        now = time.time()
        if not self._damage_type_cache or (now - self._damage_type_cache_time > self._cache_ttl):
            await self._refresh_damage_type_cache()

        company_key = self._normalize_vehicle_key(vehicle_company)
        model_key = self._normalize_vehicle_key(vehicle_model)

        if company_key and model_key:
            model_price = self._model_pricing_cache.get((company_key, model_key, normalized))
            if model_price is not None:
                return model_price

        if company_key:
            brand_price = self._brand_damage_cache.get((company_key, normalized))
            if brand_price is not None:
                return brand_price

        return self._damage_type_cache.get(normalized)

    async def get_vehicle_options(self) -> dict[str, list[str]]:
        now = time.time()
        if (
            not self._vehicle_options_cache
            or (now - self._damage_type_cache_time > self._cache_ttl)
        ):
            await self._refresh_damage_type_cache()

        if not self._vehicle_options_cache:
            self._vehicle_options_cache = self._load_vehicle_options_from_csv_fallback()
        return self._vehicle_options_cache

    def _load_vehicle_options_from_csv_fallback(self) -> dict[str, list[str]]:
        candidate_paths = [
            Path(__file__).resolve().parents[5]
            / "pricing"
            / "combined_car_damage_costs_india.csv",
            Path(__file__).resolve().parents[4]
            / ".."
            / "pricing"
            / "combined_car_damage_costs_india.csv",
        ]

        for csv_path in candidate_paths:
            try:
                if not csv_path.exists():
                    continue

                options: dict[str, set[str]] = {}
                with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
                    reader = csv.DictReader(fh)
                    for row in reader:
                        brand = str(row.get("brand") or "").strip()
                        model = str(row.get("car_model") or "").strip()
                        if not brand:
                            continue
                        options.setdefault(brand, set())
                        if model:
                            options[brand].add(model)

                resolved = {brand: sorted(models) for brand, models in options.items()}
                if resolved:
                    logger.info(
                        f"Loaded vehicle options from CSV fallback: {len(resolved)} companies"
                    )
                return resolved
            except Exception as e:
                logger.warning(f"Failed CSV vehicle-options fallback at {csv_path}: {e}")

        return {}

    def _load_pricing_from_csv_fallback(
        self,
    ) -> tuple[dict[str, int], dict[tuple[str, str, str], int], dict[tuple[str, str], int]]:
        candidate_paths = [
            Path(__file__).resolve().parents[5]
            / "pricing"
            / "combined_car_damage_costs_india.csv",
            Path(__file__).resolve().parents[4]
            / ".."
            / "pricing"
            / "combined_car_damage_costs_india.csv",
        ]

        for csv_path in candidate_paths:
            try:
                if not csv_path.exists():
                    continue

                grouped: dict[str, list[int]] = {}
                model_grouped: dict[tuple[str, str, str], list[int]] = {}
                brand_grouped: dict[tuple[str, str], list[int]] = {}

                with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
                    reader = csv.DictReader(fh)
                    for row in reader:
                        damage_type = self._normalize_damage_type(row.get("damage_type"))
                        if not damage_type:
                            continue

                        brand_key = self._normalize_vehicle_key(row.get("brand"))
                        model_key = self._normalize_vehicle_key(row.get("car_model"))

                        try:
                            cost = int(row.get("estimated_repair_cost_inr") or 0)
                        except (TypeError, ValueError):
                            continue

                        grouped.setdefault(damage_type, []).append(cost)

                        if brand_key:
                            brand_grouped.setdefault((brand_key, damage_type), []).append(cost)
                            if model_key:
                                model_grouped.setdefault(
                                    (brand_key, model_key, damage_type), []
                                ).append(cost)

                defaults = {
                    key: round(sum(values) / len(values))
                    for key, values in grouped.items()
                    if values
                }
                model_prices = {
                    key: round(sum(values) / len(values))
                    for key, values in model_grouped.items()
                    if values
                }
                brand_prices = {
                    key: round(sum(values) / len(values))
                    for key, values in brand_grouped.items()
                    if values
                }

                if defaults or model_prices or brand_prices:
                    logger.info(
                        "Loaded pricing from CSV fallback: "
                        f"{len(model_prices)} model-level, {len(brand_prices)} brand-level, {len(defaults)} defaults"
                    )

                return defaults, model_prices, brand_prices
            except Exception as e:
                logger.warning(f"Failed CSV pricing fallback at {csv_path}: {e}")

        return {}, {}, {}

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
