import { Outlet, Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Wallet, PiggyBank, LogOut, Menu, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn, formatCurrency } from '../../lib/utils'
import AddTransactionModal from '../ui/AddTransactionModal'
import { supabase } from '../../lib/supabase'

export default function RootLayout() {
    const { user, loading, signOut } = useAuth()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isTxModalOpen, setIsTxModalOpen] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [expandedAccounts, setExpandedAccounts] = useState(true)

    useEffect(() => {
        if (user) {
            supabase.from('accounts').select('*').eq('user_id', user.id).then(({ data }) => {
                if (data) setAccounts(data)
            })
        }
    }, [user])

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>
    if (!user) return <Navigate to="/auth" replace />

    const navigation = [
        { name: 'Ngân sách (Budget)', href: '/', icon: PiggyBank },
        { name: 'Báo cáo (Reports)', href: '/reports', icon: LayoutDashboard },
        { name: 'Tất cả tài khoản', href: '/accounts', icon: Wallet },
    ]

    return (
        <div className="min-h-screen flex text-slate-900 font-sans">
            <AddTransactionModal
                isOpen={isTxModalOpen}
                onClose={() => setIsTxModalOpen(false)}
                onSuccess={() => window.location.reload()}
            />

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Dark Theme like YNAB */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-[#1a237e] text-blue-100 flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* User Info / Brand */}
                <div className="flex items-center px-4 h-16 bg-[#151b60]">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="truncate font-medium text-white flex-1">
                        {user.user_metadata.full_name || 'My Budget'}
                    </div>
                </div>

                <div className="p-4">
                    <button
                        onClick={() => setIsTxModalOpen(true)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-white text-[#1a237e] font-semibold rounded-md hover:bg-blue-50 transition shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Giao dịch
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-6">
                    {/* Main Navigation */}
                    <nav className="space-y-1">
                        {navigation.slice(0, 2).map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-[#283593] text-white"
                                            : "text-blue-200 hover:bg-[#283593] hover:text-white"
                                    )}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0",
                                        isActive ? "text-white" : "text-blue-300 group-hover:text-white"
                                    )} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Accounts Section */}
                    <div>
                        <div
                            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-blue-300 uppercase tracking-wider cursor-pointer hover:text-white"
                            onClick={() => setExpandedAccounts(!expandedAccounts)}
                        >
                            <span>Tài khoản</span>
                            {expandedAccounts ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </div>

                        {expandedAccounts && (
                            <div className="space-y-1 mt-1">
                                <Link
                                    to="/accounts"
                                    className={cn(
                                        "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        location.pathname === '/accounts' ? "bg-[#283593] text-white" : "text-blue-200 hover:bg-[#283593] hover:text-white"
                                    )}
                                >
                                    <span className="flex items-center">
                                        <Wallet className="mr-3 h-4 w-4 text-blue-300" />
                                        Tất cả
                                    </span>
                                    <span>{formatCurrency(accounts.reduce((acc, a) => acc + a.balance, 0))}</span>
                                </Link>

                                {accounts.map(acc => (
                                    <div key={acc.id} className="group flex items-center justify-between px-3 py-1.5 text-sm text-blue-200 hover:bg-[#283593] hover:text-white rounded-md cursor-pointer ml-2">
                                        <span className="truncate">{acc.name}</span>
                                        <span className="text-xs">{formatCurrency(acc.balance)}</span>
                                    </div>
                                ))}

                                <button
                                    onClick={() => window.location.href = '/accounts'}
                                    className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:text-white flex items-center ml-2"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Thêm tài khoản
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-[#283593]">
                    <button
                        onClick={signOut}
                        className="flex items-center w-full px-2 py-2 text-sm font-medium text-blue-200 hover:text-white rounded-md hover:bg-[#283593] transition"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f4f4]">
                <header className="bg-white shadow-sm md:hidden z-30">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">FinFlow</h1>
                        <div className="w-6" />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
