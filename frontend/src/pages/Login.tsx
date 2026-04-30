import { useAuthStore } from "@/stores/authStore";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);
    const authError = useAuthStore((state) => state.error);
    const setError = useAuthStore((state) => state.setError);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLocalError("");
        setError(null);

        if (!email || !password) {
            setLocalError("Please enter your email and password");
            return;
        }

        try {
            await login(email, password);
            const loggedInUser = useAuthStore.getState().user;
            navigate(loggedInUser?.role === "workshop" ? "/workshop-dashboard" : "/dashboard");
        } catch {
            // Error message is handled by the store.
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-12">
            <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                <p className="mt-2 text-sm text-slate-600">Log in to continue designing and booking workshops.</p>

                {(localError || authError) && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{localError || authError}</div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                            placeholder="Your password"
                            autoComplete="current-password"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isLoading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-slate-600">
                    No account yet?{" "}
                    <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
