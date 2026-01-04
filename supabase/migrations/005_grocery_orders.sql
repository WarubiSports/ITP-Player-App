-- =============================================
-- GROCERY ORDERING SYSTEM
-- Migration 005 - Grocery Orders Feature
-- =============================================

-- =============================================
-- GROCERY ITEMS TABLE
-- =============================================
CREATE TABLE public.grocery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('household', 'produce', 'meat', 'dairy', 'carbs', 'drinks', 'spices', 'frozen')),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX grocery_items_category_idx ON public.grocery_items(category);

-- Enable RLS
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grocery items"
    ON public.grocery_items FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage grocery items"
    ON public.grocery_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- GROCERY ORDERS TABLE
-- =============================================
CREATE TABLE public.grocery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id),
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX grocery_orders_player_idx ON public.grocery_orders(player_id);
CREATE INDEX grocery_orders_delivery_date_idx ON public.grocery_orders(delivery_date);
CREATE INDEX grocery_orders_status_idx ON public.grocery_orders(status);

-- Enable RLS
ALTER TABLE public.grocery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own orders"
    ON public.grocery_orders FOR SELECT
    USING (
        player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Players can create own orders"
    ON public.grocery_orders FOR INSERT
    WITH CHECK (
        player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can manage all orders"
    ON public.grocery_orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- GROCERY ORDER ITEMS TABLE
-- =============================================
CREATE TABLE public.grocery_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.grocery_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.grocery_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_at_order DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX grocery_order_items_order_idx ON public.grocery_order_items(order_id);

-- Enable RLS
ALTER TABLE public.grocery_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items for visible orders"
    ON public.grocery_order_items FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.grocery_orders WHERE
            player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('admin', 'staff')
            )
        )
    );

CREATE POLICY "Players can create order items for own orders"
    ON public.grocery_order_items FOR INSERT
    WITH CHECK (
        order_id IN (
            SELECT id FROM public.grocery_orders WHERE
            player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
        )
    );

-- =============================================
-- SEED GROCERY ITEMS
-- =============================================
INSERT INTO public.grocery_items (name, category, price) VALUES
-- Household (Free items)
('Paper Towels', 'household', 0.00),
('Dish Soap', 'household', 0.00),
('Laundry Detergent', 'household', 0.00),
('Trash Bags', 'household', 0.00),
('Sponges', 'household', 0.00),
('All-Purpose Cleaner', 'household', 0.00),
('Toilet Paper', 'household', 0.00),

-- Produce
('Bananas (1kg)', 'produce', 1.49),
('Apples (1kg)', 'produce', 2.29),
('Oranges (1kg)', 'produce', 2.49),
('Tomatoes (500g)', 'produce', 1.99),
('Broccoli', 'produce', 1.79),
('Spinach (200g)', 'produce', 1.49),
('Carrots (1kg)', 'produce', 1.29),
('Bell Peppers (3 pack)', 'produce', 2.99),
('Avocados (2 pack)', 'produce', 2.49),
('Mixed Salad (150g)', 'produce', 1.99),

-- Meat
('Chicken Breast (500g)', 'meat', 5.99),
('Ground Beef (500g)', 'meat', 4.99),
('Salmon Fillet (200g)', 'meat', 6.49),
('Turkey Breast (400g)', 'meat', 5.49),
('Eggs (12 pack)', 'meat', 2.99),
('Bacon (200g)', 'meat', 3.49),

-- Dairy
('Whole Milk (1L)', 'dairy', 1.29),
('Greek Yogurt (500g)', 'dairy', 2.49),
('Cheddar Cheese (200g)', 'dairy', 2.79),
('Butter (250g)', 'dairy', 2.19),
('Cottage Cheese (250g)', 'dairy', 1.99),
('Skyr (450g)', 'dairy', 2.29),

-- Carbs
('Wholegrain Bread', 'carbs', 1.99),
('Pasta (500g)', 'carbs', 1.29),
('Brown Rice (1kg)', 'carbs', 2.49),
('Oats (500g)', 'carbs', 1.79),
('Quinoa (500g)', 'carbs', 3.49),
('Sweet Potatoes (1kg)', 'carbs', 2.29),

-- Drinks
('Orange Juice (1L)', 'drinks', 2.49),
('Mineral Water (6 pack)', 'drinks', 2.99),
('Protein Shake', 'drinks', 2.99),
('Green Tea (20 bags)', 'drinks', 2.29),
('Coconut Water (1L)', 'drinks', 2.99),

-- Spices & Sauces
('Olive Oil (500ml)', 'spices', 4.99),
('Salt', 'spices', 0.99),
('Black Pepper', 'spices', 1.99),
('Tomato Sauce (500g)', 'spices', 1.49),
('Soy Sauce (250ml)', 'spices', 2.29),
('Honey (350g)', 'spices', 3.49),
('Peanut Butter (350g)', 'spices', 2.99),

-- Frozen
('Frozen Berries (500g)', 'frozen', 3.49),
('Frozen Vegetables (750g)', 'frozen', 2.49),
('Frozen Fish Fillets (400g)', 'frozen', 5.99),
('Ice Cream (500ml)', 'frozen', 2.99);

-- =============================================
-- FUNCTION: Calculate Weekly Budget Usage
-- =============================================
CREATE OR REPLACE FUNCTION get_weekly_budget_usage(p_player_id UUID, p_week_start DATE)
RETURNS DECIMAL AS $$
DECLARE
    total_spent DECIMAL;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO total_spent
    FROM public.grocery_orders
    WHERE player_id = p_player_id
      AND delivery_date >= p_week_start
      AND delivery_date < p_week_start + INTERVAL '7 days'
      AND status != 'cancelled';

    RETURN total_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
