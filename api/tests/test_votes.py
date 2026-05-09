import uuid

import pytest
from sqlalchemy import select

from app.models.content_item import ContentItem, ContentType
from app.models.vote import Vote


@pytest.fixture()
def content_item(db):
    item = ContentItem(
        type=ContentType.news,
        title="Test Article",
        body="Test body",
        category_tags=[],
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    yield item
    db.delete(item)
    db.commit()


def test_same_vote_value_removes_vote(auth_client, content_item, db):
    item_id = str(content_item.id)
    auth_client.post("/votes", json={"content_item_id": item_id, "value": 1})
    resp = auth_client.post("/votes", json={"content_item_id": item_id, "value": 1})
    assert resp.status_code == 200
    assert resp.json()["value"] == 0
    vote = db.execute(
        select(Vote).where(Vote.content_item_id == content_item.id)
    ).scalar_one_or_none()
    assert vote is None


def test_opposite_vote_value_replaces_vote(auth_client, content_item, db):
    item_id = str(content_item.id)
    auth_client.post("/votes", json={"content_item_id": item_id, "value": 1})
    resp = auth_client.post("/votes", json={"content_item_id": item_id, "value": -1})
    assert resp.status_code == 200
    assert resp.json()["value"] == -1
    votes = db.execute(
        select(Vote).where(Vote.content_item_id == content_item.id)
    ).scalars().all()
    assert len(votes) == 1
    assert votes[0].value == -1


def test_vote_on_missing_item_returns_404(auth_client):
    resp = auth_client.post("/votes", json={"content_item_id": str(uuid.uuid4()), "value": 1})
    assert resp.status_code == 404
