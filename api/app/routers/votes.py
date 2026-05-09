import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.content_item import ContentItem
from app.models.vote import Vote
from app.models.user import User
from app.schemas.votes import VoteRequest, VoteResponse

router = APIRouter()


@router.post("/votes", response_model=VoteResponse)
def cast_vote(
    body: VoteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(ContentItem, body.content_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found")

    existing = db.execute(
        select(Vote).where(
            Vote.user_id == user.id,
            Vote.content_item_id == body.content_item_id,
        )
    ).scalar_one_or_none()

    if body.value == 0:
        if existing:
            db.delete(existing)
            db.commit()
        return VoteResponse(content_item_id=body.content_item_id, value=0)

    if existing:
        if existing.value == body.value:
            db.delete(existing)
            db.commit()
            return VoteResponse(content_item_id=body.content_item_id, value=0)
        else:
            existing.value = body.value
            db.commit()
            return VoteResponse(content_item_id=body.content_item_id, value=existing.value)
    else:
        vote = Vote(
            user_id=user.id,
            content_item_id=body.content_item_id,
            value=body.value,
        )
        db.add(vote)
        db.commit()
        return VoteResponse(content_item_id=body.content_item_id, value=vote.value)
