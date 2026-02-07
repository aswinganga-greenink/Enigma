from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from comments.models import Comment
from comments.schemas import CommentCreate, CommentOut
from db.deps import get_db

router = APIRouter(prefix="/comments", tags=["Comments"])

from pydantic import BaseModel, Field

@router.post("")
def add_comment(
    payload: CommentCreate,
    db: Session = Depends(get_db)
):
    comment = Comment(
        location_id=payload.location_id,
        content=payload.content
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {"message": "Comment added"}

@router.get("/{location_id}", response_model=list[CommentOut])
def get_comments(
    location_id: str,
    db: Session = Depends(get_db)
):
    comments = (
        db.query(Comment)
        .filter(Comment.location_id == location_id)
        .order_by(Comment.created_at.desc())
        .all()
    )

    return comments

