from app.db.supabase_client import get_supabase_client
from app.utils.logger import logger


class UserRepository:
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "users"

    async def get_by_id(self, user_id: str) -> dict | None:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        return response.data

    async def get_by_email(self, email: str) -> dict | None:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        return response.data

    async def create(self, user_id: str, name: str, email: str, policy_type: str | None = None) -> dict:
        data = {
            "id": user_id,
            "name": name,
            "email": email,
            "password_hash": "managed_by_supabase_auth",
        }
        if policy_type:
            data["policy_type"] = policy_type

        response = self.client.table(self.table).insert(data).execute()
        logger.info(f"User created: {user_id}")
        return response.data[0]
