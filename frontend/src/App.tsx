import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";

// Pages
import BookingConfirmation from "@/pages/BookingConfirmation";
import BookingFlow from "@/pages/BookingFlow";
import DesignStudio from "@/pages/DesignStudio";
import ErrorPage from "@/pages/Error";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Register from "@/pages/Register";
import UserDashboard from "@/pages/UserDashboard";
import WorkshopBrowse from "@/pages/WorkshopBrowse";
import WorkshopDashboard from "@/pages/WorkshopDashboard";
import WorkshopDetail from "@/pages/WorkshopDetail";

// Layouts & Components
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import Toast from "@/components/Toast";

function App() {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const getCurrentUser = useAuthStore((state) => state.getCurrentUser);

    useEffect(() => {
        if (token && !user) {
            void getCurrentUser();
        }
    }, [token, user, getCurrentUser]);

    return (
        <ErrorBoundary>
            <Router>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/login"
                            element={user ? <Navigate to={user.role === "workshop" ? "/workshop-dashboard" : "/dashboard"} /> : <Login />}
                        />
                        <Route
                            path="/register"
                            element={user ? <Navigate to={user.role === "workshop" ? "/workshop-dashboard" : "/dashboard"} /> : <Register />}
                        />
                        <Route path="/design-studio" element={<DesignStudio />} />
                        <Route path="/workshops" element={<WorkshopBrowse />} />
                        <Route path="/workshops/:id" element={<WorkshopDetail />} />
                        <Route path="/booking/:workshopId" element={<BookingFlow />} />
                        <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
                        <Route path="/dashboard" element={user ? <UserDashboard /> : <Navigate to="/login" />} />
                        <Route path="/workshop-dashboard" element={user?.role === "workshop" ? <WorkshopDashboard /> : <Navigate to="/login" />} />
                        <Route path="/error" element={<ErrorPage />} />
                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
                <Toast />
            </Router>
        </ErrorBoundary>
    );
}

export default App;
