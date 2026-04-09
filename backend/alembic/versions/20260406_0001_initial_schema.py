"""initial schema

Revision ID: 20260406_0001
Revises: None
Create Date: 2026-04-06 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260406_0001"
down_revision = None
branch_labels = None
depends_on = None


user_role = postgresql.ENUM("admin", "manager", "operator", name="user_role")
inventory_movement_type = postgresql.ENUM(
    "entry",
    "adjustment",
    "sale",
    name="inventory_movement_type",
)
theme_preference = postgresql.ENUM("light", "dark", name="theme_preference")

metadata = sa.MetaData()

tenants = sa.Table(
    "tenants",
    metadata,
    sa.Column("name", sa.String(length=255), nullable=False),
    sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.PrimaryKeyConstraint("id", name=op.f("pk_tenants")),
)

users = sa.Table(
    "users",
    metadata,
    sa.Column("tenant_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("name", sa.String(length=255), nullable=False),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("password_hash", sa.String(length=255), nullable=False),
    sa.Column("role", user_role, nullable=False),
    sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.ForeignKeyConstraint(
        ["tenant_id"],
        ["tenants.id"],
        ondelete="CASCADE",
        name=op.f("fk_users_tenant_id_tenants"),
    ),
    sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    sa.UniqueConstraint("email", name=op.f("uq_users_email")),
)

products = sa.Table(
    "products",
    metadata,
    sa.Column("tenant_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("name", sa.String(length=255), nullable=False),
    sa.Column("category", sa.String(length=120), nullable=False),
    sa.Column("sale_price", sa.Numeric(12, 2), nullable=False),
    sa.Column("cost_price", sa.Numeric(12, 2), nullable=False),
    sa.Column("stock_quantity", sa.Integer(), server_default=sa.text("0"), nullable=False),
    sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.CheckConstraint("cost_price > 0", name=op.f("ck_products_cost_price_positive")),
    sa.CheckConstraint("sale_price > 0", name=op.f("ck_products_sale_price_positive")),
    sa.CheckConstraint(
        "stock_quantity >= 0",
        name=op.f("ck_products_stock_quantity_non_negative"),
    ),
    sa.ForeignKeyConstraint(
        ["tenant_id"],
        ["tenants.id"],
        ondelete="CASCADE",
        name=op.f("fk_products_tenant_id_tenants"),
    ),
    sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
)

company_settings = sa.Table(
    "company_settings",
    metadata,
    sa.Column("tenant_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("company_name", sa.String(length=255), nullable=False),
    sa.Column("segment", sa.String(length=120), nullable=False),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("phone", sa.String(length=60), nullable=False),
    sa.Column("theme_preference", theme_preference, nullable=False),
    sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.ForeignKeyConstraint(
        ["tenant_id"],
        ["tenants.id"],
        ondelete="CASCADE",
        name=op.f("fk_company_settings_tenant_id_tenants"),
    ),
    sa.PrimaryKeyConstraint("id", name=op.f("pk_company_settings")),
    sa.UniqueConstraint("tenant_id", name=op.f("uq_company_settings_tenant_id")),
)

inventory_movements = sa.Table(
    "inventory_movements",
    metadata,
    sa.Column("tenant_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("product_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("type", inventory_movement_type, nullable=False),
    sa.Column("quantity", sa.Integer(), nullable=False),
    sa.Column("note", sa.Text(), nullable=True),
    sa.Column("created_by", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.CheckConstraint(
        "quantity <> 0",
        name=op.f("ck_inventory_movements_inventory_quantity_non_zero"),
    ),
    sa.ForeignKeyConstraint(
        ["created_by"],
        ["users.id"],
        ondelete="RESTRICT",
        name=op.f("fk_inventory_movements_created_by_users"),
    ),
    sa.ForeignKeyConstraint(
        ["product_id"],
        ["products.id"],
        ondelete="CASCADE",
        name=op.f("fk_inventory_movements_product_id_products"),
    ),
    sa.ForeignKeyConstraint(
        ["tenant_id"],
        ["tenants.id"],
        ondelete="CASCADE",
        name=op.f("fk_inventory_movements_tenant_id_tenants"),
    ),
    sa.PrimaryKeyConstraint("id", name=op.f("pk_inventory_movements")),
)

sales = sa.Table(
    "sales",
    metadata,
    sa.Column("tenant_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
    sa.Column("sale_date", sa.DateTime(timezone=True), nullable=False),
    sa.Column("created_by", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    ),
    sa.ForeignKeyConstraint(
        ["created_by"],
        ["users.id"],
        ondelete="RESTRICT",
        name=op.f("fk_sales_created_by_users"),
    ),
    sa.ForeignKeyConstraint(
        ["tenant_id"],
        ["tenants.id"],
        ondelete="CASCADE",
        name=op.f("fk_sales_tenant_id_tenants"),
    ),
    sa.PrimaryKeyConstraint("id", name=op.f("pk_sales")),
)

sale_items = sa.Table(
    "sale_items",
    metadata,
    sa.Column("sale_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("product_id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.Column("quantity", sa.Integer(), nullable=False),
    sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
    sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
    sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
    sa.CheckConstraint("quantity > 0", name=op.f("ck_sale_items_sale_item_quantity_positive")),
    sa.CheckConstraint(
        "subtotal >= 0",
        name=op.f("ck_sale_items_sale_item_subtotal_non_negative"),
    ),
    sa.CheckConstraint(
        "unit_price > 0",
        name=op.f("ck_sale_items_sale_item_unit_price_positive"),
    ),
    sa.ForeignKeyConstraint(
        ["product_id"],
        ["products.id"],
        ondelete="RESTRICT",
        name=op.f("fk_sale_items_product_id_products"),
    ),
    sa.ForeignKeyConstraint(
        ["sale_id"],
        ["sales.id"],
        ondelete="CASCADE",
        name=op.f("fk_sale_items_sale_id_sales"),
    ),
    sa.PrimaryKeyConstraint("id", name=op.f("pk_sale_items")),
)

indexes = (
    sa.Index(op.f("ix_users_email"), users.c.email),
    sa.Index(op.f("ix_users_tenant_id"), users.c.tenant_id),
    sa.Index(op.f("ix_products_category"), products.c.category),
    sa.Index(op.f("ix_products_name"), products.c.name),
    sa.Index(op.f("ix_products_tenant_id"), products.c.tenant_id),
    sa.Index(op.f("ix_company_settings_tenant_id"), company_settings.c.tenant_id),
    sa.Index(op.f("ix_inventory_movements_created_by"), inventory_movements.c.created_by),
    sa.Index(op.f("ix_inventory_movements_product_id"), inventory_movements.c.product_id),
    sa.Index(op.f("ix_inventory_movements_tenant_id"), inventory_movements.c.tenant_id),
    sa.Index(op.f("ix_sales_created_by"), sales.c.created_by),
    sa.Index(op.f("ix_sales_sale_date"), sales.c.sale_date),
    sa.Index(op.f("ix_sales_tenant_id"), sales.c.tenant_id),
    sa.Index(op.f("ix_sale_items_product_id"), sale_items.c.product_id),
    sa.Index(op.f("ix_sale_items_sale_id"), sale_items.c.sale_id),
)

tables_in_creation_order = (
    tenants,
    users,
    products,
    company_settings,
    inventory_movements,
    sales,
    sale_items,
)

tables_in_drop_order = tuple(reversed(tables_in_creation_order))


def upgrade() -> None:
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    inventory_movement_type.create(bind, checkfirst=True)
    theme_preference.create(bind, checkfirst=True)

    for table in tables_in_creation_order:
        table.create(bind, checkfirst=True)

    for index in indexes:
        index.create(bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()

    for index in reversed(indexes):
        index.drop(bind, checkfirst=True)

    for table in tables_in_drop_order:
        table.drop(bind, checkfirst=True)

    theme_preference.drop(bind, checkfirst=True)
    inventory_movement_type.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)
