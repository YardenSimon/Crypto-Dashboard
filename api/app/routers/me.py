from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, set_auth_cookie
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.preferences import CoinOrderRequest, LayoutRequest, PreferencesRequest, PreferencesResponse
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(response: Response, user: User = Depends(get_current_user)):
    # Refresh cookie expiry on every authenticated request (sliding session)
    set_auth_cookie(response, create_access_token({"sub": str(user.id)}))
    return user


@router.get("/me/preferences", response_model=PreferencesResponse)
def get_preferences(user: User = Depends(get_current_user)):
    if not user.preferences:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not set")
    return user.preferences


@router.put("/me/preferences", response_model=PreferencesResponse)
def put_preferences(
    body: PreferencesRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.preferences:
        user.preferences.coins = body.coins
        user.preferences.investor_types = body.investor_types
        user.preferences.content_types = body.content_types
    else:
        db.add(UserPreference(
            user_id=user.id,
            coins=body.coins,
            investor_types=body.investor_types,
            content_types=body.content_types,
        ))

    if not user.onboarding_completed:
        user.onboarding_completed = True

    db.commit()
    db.refresh(user)
    return user.preferences


@router.patch("/me/layout", response_model=PreferencesResponse)
def patch_layout(
    body: LayoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.preferences:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not set")
    user.preferences.dashboard_layout = body.layout
    db.commit()
    db.refresh(user)
    return user.preferences


@router.patch("/me/coin-order", response_model=PreferencesResponse)
def patch_coin_order(
    body: CoinOrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.preferences:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not set")
    user.preferences.coin_order = body.coin_order
    db.commit()
    db.refresh(user)
    return user.preferences
