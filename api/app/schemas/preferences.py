from pydantic import BaseModel, ConfigDict, field_validator

VALID_COINS = {"BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "MATIC", "DOT", "AVAX", "LINK", "UNI"}
VALID_INVESTOR_TYPES = {"HODLer", "Day Trader", "NFT Collector"}
VALID_CONTENT_TYPES = {"Market News", "Charts", "Social", "Fun"}


class PreferencesRequest(BaseModel):
    coins: list[str]
    investor_types: list[str]
    content_types: list[str]

    @field_validator("coins")
    @classmethod
    def validate_coins(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("at least one coin is required")
        invalid = set(v) - VALID_COINS
        if invalid:
            raise ValueError(f"invalid coins: {invalid}")
        return list(dict.fromkeys(v))  # deduplicate, preserve order

    @field_validator("investor_types")
    @classmethod
    def validate_investor_types(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("at least one investor type is required")
        if len(v) > 2:
            raise ValueError("maximum 2 investor types allowed")
        invalid = set(v) - VALID_INVESTOR_TYPES
        if invalid:
            raise ValueError(f"invalid investor types: {invalid}")
        return list(dict.fromkeys(v))

    @field_validator("content_types")
    @classmethod
    def validate_content_types(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("at least one content type is required")
        if len(v) > 4:
            raise ValueError("maximum 4 content types allowed")
        invalid = set(v) - VALID_CONTENT_TYPES
        if invalid:
            raise ValueError(f"invalid content types: {invalid}")
        return list(dict.fromkeys(v))


class PreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    coins: list[str]
    investor_types: list[str]
    content_types: list[str]
