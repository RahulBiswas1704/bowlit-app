// --- CENTRAL TYPES ---

export type MenuItem = {
    id: number;
    name: string;
    price: number;
    type: string;
    is_available: boolean;
    description?: string;
    image?: string;
};

export type Order = {
    id: number;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    address: string;
    items: any[];
    total_amount: number;
    status: string;
    rider_phone: string | null;
    user_id?: string;
    customer_latitude?: number;
    customer_longitude?: number;
    building_name?: string;
    delivery_instructions?: string;
};

export type Rider = {
    phone: string;
    name: string;
    status: string;
};

export type Customer = {
    id: string;
    email: string;
    phone: string;
    full_name: string;
    office: string;
    diet: string;
    balance: number; // Joined from wallets
};

export type Plan = {
    id: string;
    name: string;
    base_price: number;
    description: string;
    type: string;
    features: string[];
};

export type WeeklyMenu = {
    day_of_week: string;
    lunch_dish: string;     // The Base (Dal + Rice)
    veg_dish: string;       // Hero for Veg Plan (Paneer)
    non_veg_dish: string;   // Hero for Non-Veg Plan (Chicken)
    week_number: number;    // 1 or 2
};
