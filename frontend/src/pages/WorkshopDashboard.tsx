import { apiClient } from "@/api/client";
import { Workshop, WorkshopAvailabilityInput, WorkshopAvailabilitySlot, WorkshopBookingSummary, WorkshopProfilePayload } from "@/types";
import { FormEvent, useEffect, useState } from "react";

const emptyProfile: WorkshopProfilePayload = {
    name: "",
    location: "",
    city: "",
    description: "",
    phone: "",
    email: "",
    imageUrl: "",
    active: true,
};

const emptySlot: WorkshopAvailabilityInput = {
    date: "",
    timeSlot: "",
    maxParticipants: 4,
    availableSpots: 4,
};

const WorkshopDashboard = () => {
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [profile, setProfile] = useState<WorkshopProfilePayload>(emptyProfile);
    const [availability, setAvailability] = useState<WorkshopAvailabilitySlot[]>([]);
    const [bookings, setBookings] = useState<WorkshopBookingSummary[]>([]);
    const [slotDraft, setSlotDraft] = useState<WorkshopAvailabilityInput>(emptySlot);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingSlot, setIsSavingSlot] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const loadDashboard = async () => {
        setIsLoading(true);
        setError("");

        try {
            const myWorkshop = await apiClient.getMyWorkshop();
            setWorkshop(myWorkshop);
            setProfile({
                name: myWorkshop.name,
                location: myWorkshop.location,
                city: myWorkshop.city,
                description: myWorkshop.description,
                phone: myWorkshop.phone,
                email: myWorkshop.email,
                imageUrl: myWorkshop.imageUrl || "",
                active: myWorkshop.active,
            });

            const [availabilityData, bookingsData] = await Promise.all([
                apiClient.getWorkshopAvailability(myWorkshop.id),
                apiClient.getWorkshopBookings(),
            ]);

            setAvailability(availabilityData);
            setBookings(bookingsData);
        } catch (loadError: any) {
            if (loadError.response?.status === 404) {
                setWorkshop(null);
                setProfile(emptyProfile);
                setAvailability([]);
                setBookings([]);
            } else {
                setError(loadError.response?.data?.message || "Could not load workshop dashboard");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadDashboard();
    }, []);

    const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!profile.name || !profile.location || !profile.city || !profile.phone || !profile.email) {
            setError("Please complete all required workshop fields");
            return;
        }

        setIsSavingProfile(true);
        try {
            const savedWorkshop = workshop ? await apiClient.updateWorkshop(profile) : await apiClient.registerWorkshop(profile);

            setWorkshop(savedWorkshop);
            setSuccessMessage(workshop ? "Workshop profile updated" : "Workshop profile created");

            const [availabilityData, bookingsData] = await Promise.all([
                apiClient.getWorkshopAvailability(savedWorkshop.id),
                apiClient.getWorkshopBookings(),
            ]);
            setAvailability(availabilityData);
            setBookings(bookingsData);
        } catch (saveError: any) {
            setError(saveError.response?.data?.message || "Could not save workshop profile");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleAddAvailability = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!workshop) {
            setError("Create your workshop profile before adding availability");
            return;
        }

        if (!slotDraft.date || !slotDraft.timeSlot) {
            setError("Please provide a date and time slot");
            return;
        }

        setIsSavingSlot(true);
        try {
            const slots = await apiClient.setWorkshopAvailability({
                slots: [
                    {
                        date: slotDraft.date,
                        timeSlot: slotDraft.timeSlot,
                        maxParticipants: Number(slotDraft.maxParticipants || 1),
                        availableSpots: Number(slotDraft.availableSpots || slotDraft.maxParticipants || 1),
                    },
                ],
            });
            setAvailability(slots);
            setSlotDraft(emptySlot);
            setSuccessMessage("Availability updated");
        } catch (saveError: any) {
            setError(saveError.response?.data?.message || "Could not save availability");
        } finally {
            setIsSavingSlot(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-600">Loading workshop dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 p-8 text-white shadow-xl">
                    <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Workshop Dashboard</p>
                    <h1 className="mt-2 text-3xl font-bold md:text-4xl">{workshop ? workshop.name : "Set Up Your Workshop Profile"}</h1>
                    <p className="mt-3 max-w-3xl text-indigo-100">
                        Manage your public studio profile, publish availability, and track upcoming bookings.
                    </p>
                </header>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                {successMessage && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
                )}

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <form onSubmit={handleProfileSubmit} className="rounded-2xl bg-white p-6 shadow-md">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Workshop Profile</h2>
                                <p className="mt-1 text-sm text-slate-600">This information is shown on your public workshop page.</p>
                            </div>
                            {workshop && (
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${workshop.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}
                                >
                                    {workshop.active ? "Live" : "Hidden"}
                                </span>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1 md:col-span-2">
                                <span className="text-sm font-medium text-slate-700">Workshop Name</span>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile((state) => ({ ...state, name: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm font-medium text-slate-700">City</span>
                                <input
                                    type="text"
                                    value={profile.city}
                                    onChange={(e) => setProfile((state) => ({ ...state, city: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm font-medium text-slate-700">Location</span>
                                <input
                                    type="text"
                                    value={profile.location}
                                    onChange={(e) => setProfile((state) => ({ ...state, location: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm font-medium text-slate-700">Phone</span>
                                <input
                                    type="text"
                                    value={profile.phone}
                                    onChange={(e) => setProfile((state) => ({ ...state, phone: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-sm font-medium text-slate-700">Public Email</span>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile((state) => ({ ...state, email: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="space-y-1 md:col-span-2">
                                <span className="text-sm font-medium text-slate-700">Image URL</span>
                                <input
                                    type="url"
                                    value={profile.imageUrl}
                                    onChange={(e) => setProfile((state) => ({ ...state, imageUrl: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="https://..."
                                />
                            </label>

                            <label className="space-y-1 md:col-span-2">
                                <span className="text-sm font-medium text-slate-700">Description</span>
                                <textarea
                                    rows={5}
                                    value={profile.description}
                                    onChange={(e) => setProfile((state) => ({ ...state, description: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="flex items-center gap-3 md:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={Boolean(profile.active)}
                                    onChange={(e) => setProfile((state) => ({ ...state, active: e.target.checked }))}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-slate-700">Show this workshop publicly in browse results</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {isSavingProfile ? "Saving..." : workshop ? "Update Profile" : "Create Profile"}
                        </button>
                    </form>

                    <div className="space-y-6">
                        <form onSubmit={handleAddAvailability} className="rounded-2xl bg-white p-6 shadow-md">
                            <h2 className="text-xl font-semibold text-slate-900">Add Availability</h2>
                            <p className="mt-1 text-sm text-slate-600">Publish individual workshop sessions for customers to book.</p>

                            <div className="mt-4 grid gap-4">
                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-slate-700">Date</span>
                                    <input
                                        type="date"
                                        value={slotDraft.date}
                                        onChange={(e) => setSlotDraft((state) => ({ ...state, date: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-slate-700">Time Slot</span>
                                    <input
                                        type="text"
                                        value={slotDraft.timeSlot}
                                        onChange={(e) => setSlotDraft((state) => ({ ...state, timeSlot: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        placeholder="09:00-12:00"
                                    />
                                </label>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="space-y-1">
                                        <span className="text-sm font-medium text-slate-700">Max Participants</span>
                                        <input
                                            type="number"
                                            min={1}
                                            value={slotDraft.maxParticipants}
                                            onChange={(e) => setSlotDraft((state) => ({ ...state, maxParticipants: Number(e.target.value) }))}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </label>

                                    <label className="space-y-1">
                                        <span className="text-sm font-medium text-slate-700">Available Spots</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={slotDraft.availableSpots}
                                            onChange={(e) => setSlotDraft((state) => ({ ...state, availableSpots: Number(e.target.value) }))}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingSlot}
                                className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                {isSavingSlot ? "Saving slot..." : "Save Slot"}
                            </button>
                        </form>

                        <section className="rounded-2xl bg-white p-6 shadow-md">
                            <h2 className="text-xl font-semibold text-slate-900">Published Availability</h2>
                            {availability.length === 0 ? (
                                <p className="mt-3 text-sm text-slate-600">No sessions published yet.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {availability.map((slot) => (
                                        <div key={slot.id} className="rounded-lg border border-slate-200 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{slot.date}</p>
                                                    <p className="text-sm text-slate-600">{slot.timeSlot}</p>
                                                </div>
                                                <div className="text-right text-sm text-slate-600">
                                                    <p>
                                                        {slot.availableSpots}/{slot.maxParticipants} spots
                                                    </p>
                                                    <p>{slot.isBooked ? "Booked out" : "Available"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-md">
                    <h2 className="text-xl font-semibold text-slate-900">Upcoming Bookings</h2>
                    {bookings.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">No bookings have been made yet.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500">
                                        <th className="py-2">Customer</th>
                                        <th className="py-2">Date</th>
                                        <th className="py-2">Participants</th>
                                        <th className="py-2">Design</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="border-b border-slate-100">
                                            <td className="py-3 text-slate-700">
                                                <p className="font-medium">{booking.customer_name || "Unknown customer"}</p>
                                                <p className="text-xs text-slate-500">{booking.customer_email || "No email"}</p>
                                            </td>
                                            <td className="py-3 text-slate-700">
                                                <p>{booking.date}</p>
                                                <p className="text-xs text-slate-500">{booking.time_slot}</p>
                                            </td>
                                            <td className="py-3 text-slate-700">{booking.participant_count}</td>
                                            <td className="py-3 text-slate-700">{booking.design_name || "No design attached"}</td>
                                            <td className="py-3">
                                                <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-slate-700">NT$ {Number(booking.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default WorkshopDashboard;
