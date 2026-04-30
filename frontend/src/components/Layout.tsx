import { useAuthStore } from "@/stores/authStore";
import { Link, Outlet } from "react-router-dom";

const Layout = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white shadow">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold text-indigo-600">
                        🎨 Indigo
                    </Link>
                    <div className="flex gap-4 items-center">
                        <Link to="/workshops" className="text-gray-700 hover:text-indigo-600">
                            Workshops
                        </Link>
                        <Link to="/design-studio" className="text-gray-700 hover:text-indigo-600">
                            Design Studio
                        </Link>
                        {user ? (
                            <>
                                {user.role === "workshop" && (
                                    <Link to="/workshop-dashboard" className="text-gray-700 hover:text-indigo-600">
                                        Dashboard
                                    </Link>
                                )}
                                {user.role === "user" && (
                                    <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600">
                                        My Dashboard
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        logout();
                                        window.location.href = "/";
                                    }}
                                    className="text-gray-700 hover:text-red-600"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 hover:text-indigo-600">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            {/* Main content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-400">© 2026 Indigo Dyeing. Preserving traditional indigo art.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
