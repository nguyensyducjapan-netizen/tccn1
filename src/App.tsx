import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthPage from './pages/Auth'
import RootLayout from './components/layout/RootLayout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/" element={<RootLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="accounts" element={<Accounts />} />
                        <Route path="reports" element={<div>Trang Báo cáo (Đang phát triển)</div>} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
