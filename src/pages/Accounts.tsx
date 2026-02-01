import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, Wallet, CreditCard, Banknote } from 'lucide-react'
import { formatCurrency, cn } from '../lib/utils'
import Modal from '../components/ui/Modal'

type Account = {
    id: string
    name: string
    type: 'checking' | 'savings' | 'credit' | 'cash'
    balance: number
}

const ACCOUNT_TYPES = [
    { id: 'checking', name: 'Tài khoản vãng lai', icon: Wallet },
    { id: 'savings', name: 'Tiết kiệm', icon: Banknote },
    { id: 'credit', name: 'Thẻ tín dụng', icon: CreditCard },
    { id: 'cash', name: 'Tiền mặt', icon: Banknote },
]

export default function Accounts() {
    const { user } = useAuth()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newAccount, setNewAccount] = useState({ name: '', type: 'checking', balance: 0 })

    useEffect(() => {
        if (user) fetchAccounts()
    }, [user])

    const fetchAccounts = async () => {
        try {
            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: true })

            if (error) throw error
            setAccounts(data as any)
        } catch (error) {
            console.error('Error fetching accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { data, error } = await supabase.from('accounts').insert({
                user_id: user!.id,
                name: newAccount.name,
                type: newAccount.type,
                balance: newAccount.balance
            }).select().single()

            if (error) throw error

            setAccounts([...accounts, data as any])
            setIsModalOpen(false)
            setNewAccount({ name: '', type: 'checking', balance: 0 })
        } catch (error) {
            alert('Error creating account: ' + (error as any).message)
        }
    }

    if (loading) return <div className="p-8">Đang tải...</div>

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Tài khoản</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm tài khoản
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <div key={account.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                                {ACCOUNT_TYPES.find(t => t.id === account.type)?.name || account.type}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{account.name}</h3>
                        <p className={cn(
                            "text-2xl font-bold",
                            account.balance >= 0 ? "text-gray-900" : "text-red-600"
                        )}>
                            {formatCurrency(account.balance)}
                        </p>
                    </div>
                ))}

                {accounts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                        Chưa có tài khoản nào. Hãy thêm tài khoản để bắt đầu theo dõi dòng tiền.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Thêm tài khoản mới"
            >
                <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="VD: Ví tiền mặt, VCB..."
                            value={newAccount.name}
                            onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            value={newAccount.type}
                            onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                        >
                            {ACCOUNT_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số dư ban đầu</label>
                        <input
                            type="number"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            value={newAccount.balance}
                            onChange={e => setNewAccount({ ...newAccount, balance: Number(e.target.value) })}
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Tạo tài khoản
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
