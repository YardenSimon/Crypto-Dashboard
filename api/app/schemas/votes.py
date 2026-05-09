import uuid
from typing import Literal
from pydantic import BaseModel


class VoteRequest(BaseModel):
    content_item_id: uuid.UUID
    value: Literal[-1, 1, 0]


class VoteResponse(BaseModel):
    content_item_id: uuid.UUID
    value: int
