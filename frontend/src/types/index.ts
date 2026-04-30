// User types
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: "user" | "workshop" | "admin";
    createdAt: string;
}

// Workshop types
export interface Workshop {
    id: string;
    name: string;
    location: string;
    city: string;
    description: string;
    ownerId: string;
    phone: string;
    email: string;
    rating: number;
    reviewCount: number;
    imageUrl?: string;
    active: boolean;
    createdAt: string;
}

export interface WorkshopAvailabilitySlot {
    id: string;
    workshopId: string;
    date: string;
    timeSlot: string;
    maxParticipants: number;
    availableSpots: number;
    isBooked: boolean;
}

export interface WorkshopAvailabilityInput {
    date: string;
    timeSlot: string;
    maxParticipants?: number;
    availableSpots?: number;
}

export interface WorkshopProfilePayload {
    name: string;
    location: string;
    city: string;
    description: string;
    phone: string;
    email: string;
    imageUrl?: string;
    active?: boolean;
}

export interface WorkshopBookingSummary {
    id: string;
    user_id: string;
    workshop_id: string;
    design_id: string | null;
    date: string;
    time_slot: string;
    participant_count: number;
    status: BookingStatus;
    price: number;
    created_at: string;
    customer_name: string | null;
    customer_email: string | null;
    design_name: string | null;
    design_image_url: string | null;
}

export interface WorkshopReviewSummary {
    id: string;
    bookingId: string;
    workshopId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
    userName: string;
}

// Design types
export interface DesignTemplate {
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    svgData: string;
    description: string;
}

export interface DesignCustomization {
    templateId: string;
    primaryColor: string;
    accentColor: string;
    scale: number;
    rotation: number;
    flipped: boolean;
}

export interface Design {
    id: string;
    userId: string;
    name: string;
    customization: DesignCustomization;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
}

// Booking types
export type BookingStatus = "pending" | "paid" | "confirmed" | "completed" | "cancelled";

export interface Booking {
    id: string;
    userId: string;
    workshopId: string;
    designId: string;
    date: string;
    timeSlot: string;
    participantCount: number;
    status: BookingStatus;
    price: number;
    stripePaymentId?: string;
    createdAt: string;
}

// Review types
export interface Review {
    id: string;
    bookingId: string;
    workshopId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// Auth types
export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    role: "user" | "workshop";
}
