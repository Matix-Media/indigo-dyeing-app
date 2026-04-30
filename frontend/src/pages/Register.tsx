import { useAuthStore } from "@/stores/authStore";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const authError = useAuthStore((state) => state.error);
    const setError = useAuthStore((state) => state.setError);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"user" | "workshop">("user");
    const [localError, setLocalError] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLocalError("");
        setError(null);

        if (!name || !email || !password) {
            setLocalError("Please fill out all required fields");
            return;
        }

        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters");
            return;
        }

        try {
            await register(email, password, name, role);
            navigate(role === "workshop" ? "/workshop-dashboard" : "/dashboard");
        } catch {
            // Error message is handled by the store.
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-12">
            <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
                <p className="mt-2 text-sm text-slate-600">Start designing with indigo patterns and booking local workshops.</p>

                {(localError || authError) && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{localError || authError}</div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-slate-700">Full Name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="Your name"
                            autoComplete="name"
                        />
                    </label>

                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-slate-700">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </label>

                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-slate-700">Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                        />
                    </label>

                    <fieldset className="space-y-2">
                        <legend className="text-sm font-medium text-slate-700">Account Type</legend>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setRole("user")}
                                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                                    role === "user" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-700"
                                }`}
                            >
                                Customer
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("workshop")}
                                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                                    role === "workshop" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-700"
                                }`}
                            >
                                Workshop
                            </button>
                        </div>
                    </fieldset>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isLoading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-slate-600">
                    Already registered?{" "}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
