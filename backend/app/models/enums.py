from enum import StrEnum


def enum_values(enum_class: type[StrEnum]) -> list[str]:
    return [member.value for member in enum_class]


class UserRole(StrEnum):
    ADMIN = "admin"
    MANAGER = "manager"
    OPERATOR = "operator"


class InventoryMovementType(StrEnum):
    ENTRY = "entry"
    ADJUSTMENT = "adjustment"
    SALE = "sale"


class ThemePreference(StrEnum):
    LIGHT = "light"
    DARK = "dark"
