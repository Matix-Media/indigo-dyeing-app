import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    Workshop,
    WorkshopAvailabilityInput,
    WorkshopAvailabilitySlot,
    WorkshopBookingSummary,
    WorkshopProfilePayload,
    WorkshopReviewSummary,
} from "@/types";
import axios, { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
        });

        // Add token to requests
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle errors
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            },
        );
    }

    // Auth endpoints
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await this.client.post("/auth/login", data);
        return response.data;
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await this.client.post("/auth/register", data);
        return response.data;
    }

    async logout(): Promise<void> {
        await this.client.post("/auth/logout");
    }

    async getCurrentUser() {
        const response = await this.client.get("/auth/me");
        return response.data;
    }

    // Design endpoints
    async getDesignTemplates() {
        const response = await this.client.get("/designs/templates");
        return response.data;
    }

    async saveDesign(design: any) {
        const response = await this.client.post("/designs", design);
        return response.data;
    }

    async getDesign(id: string) {
        const response = await this.client.get(`/designs/${id}`);
        return response.data;
    }

    async getUserDesigns() {
        const response = await this.client.get("/designs/my-designs");
        return response.data;
    }

    async deleteDesign(id: string) {
        await this.client.delete(`/designs/${id}`);
    }

    // Workshop endpoints
    async getWorkshops(filters?: Record<string, string | number>) {
        const response = await this.client.get("/workshops", { params: filters });
        return response.data as Workshop[];
    }

    async getWorkshop(id: string) {
        const response = await this.client.get(`/workshops/${id}`);
        return response.data as Workshop;
    }

    async registerWorkshop(data: WorkshopProfilePayload) {
        const response = await this.client.post("/workshops/register", data);
        return response.data as Workshop;
    }

    async getMyWorkshop() {
        const response = await this.client.get("/workshops/me");
        return response.data as Workshop;
    }

    async updateWorkshop(data: Partial<WorkshopProfilePayload>) {
        const response = await this.client.put("/workshops/me", data);
        return response.data as Workshop;
    }

    async getWorkshopAvailability(workshopId: string) {
        const response = await this.client.get(`/workshops/${workshopId}/availability`);
        return response.data as WorkshopAvailabilitySlot[];
    }

    async setWorkshopAvailability(slots: { slots: WorkshopAvailabilityInput[] }) {
        const response = await this.client.post("/workshops/me/availability", slots);
        return response.data as WorkshopAvailabilitySlot[];
    }

    async getWorkshopBookings() {
        const response = await this.client.get("/workshops/me/bookings");
        return response.data as WorkshopBookingSummary[];
    }

    // Booking endpoints
    async createBooking(data: any) {
        const response = await this.client.post("/bookings", data);
        return response.data;
    }

    async getBooking(id: string) {
        const response = await this.client.get(`/bookings/${id}`);
        return response.data;
    }

    async getUserBookings() {
        const response = await this.client.get("/bookings/my-bookings");
        return response.data;
    }

    async cancelBooking(id: string) {
        const response = await this.client.put(`/bookings/${id}/cancel`);
        return response.data;
    }

    async createStripeCheckout(bookingId: string) {
        const response = await this.client.post(`/bookings/${bookingId}/checkout`);
        return response.data;
    }

    // Review endpoints
    async createReview(data: any) {
        const response = await this.client.post("/reviews", data);
        return response.data;
    }

    async getWorkshopReviews(workshopId: string) {
        const response = await this.client.get(`/workshops/${workshopId}/reviews`);
        return response.data as WorkshopReviewSummary[];
    }
}

export const apiClient = new ApiClient();
