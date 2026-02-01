import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Modal from './Modal'
import { format } from 'date-fns'

interface AddTransactionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])

    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        payee: '',
        memo: '',
        account_id: '',
        category_id: '',
        type: 'expense' // 'expense' | 'income'
    })

    useEffect(() => {
        if (isOpen && user) {
            fetchData()
        }
    }, [isOpen, user])

    const fetchData = async () => {
        const [accRes, catRes] = await Promise.all([
            supabase.from('accounts').select('id, name').eq('user_id', user!.id),
            supabase.from('categories').select('id, name, category_groups(name)').eq('user_id', user!.id)
        ])

        if (accRes.data) setAccounts(accRes.data)
        if (catRes.data) setCategories(catRes.data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const amount = Number(formData.amount) * (formData.type === 'expense' ? -1 : 1)

            const { error } = await supabase.from('transactions').insert({
                user_id: user!.id,
                date: formData.date,
                amount: amount,
                payee: formData.payee,
                memo: formData.memo,
                account_id: formData.account_id,
                category_id: formData.category_id || null
            })

            if (error) throw error

            // Update Account Balance
            // Note: Ideally this should be a DB trigger or a stored procedure to be atomic.
            // For now, doing it client-side for simplicity, but acknowledge race conditions.
            const { data: account } = await supabase.from('accounts').select('balance').eq('id', formData.account_id).single()
            if (account) {
                await supabase.from('accounts').update({ balance: account.balance + amount }).eq('id', formData.account_id)
            }

            // Update Budget Activity if expense
            if (formData.type === 'expense' && formData.category_id) {
                // This logic is complex because 'activity' relates to the month of the transaction.
                // Simplification: We assume the budget view recalculates or we rely on a stored procedure in future.
                // For YNAB style, usually 'transactions' are the source of truth and 'activity' is a sum of transactions.
                // My budget query in Dashboard already sums? No, it selects from 'budgets' table.
                // I need a trigger to update 'budgets' table helper columns or calculate on fly.
            }

            onSuccess?.()
            onClose()
            setFormData({ ...formData, amount: '', payee: '', memo: '' })
        } catch (error) {
            alert('Error adding transaction: ' + (error as any).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm giao dịch">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex space-x-4 mb-4">
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${formData.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}
                        onClick={() => setFormData({ ...formData, type: 'expense' })}
                    >
                        Chi phí
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${formData.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        onClick={() => setFormData({ ...formData, type: 'income' })}
                    >
                        Thu nhập
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                    <input
                        type="number"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
                    <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        value={formData.account_id}
                        onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                    >
                        <option value="">Chọn tài khoản</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        value={formData.category_id}
                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                        disabled={formData.type === 'income' && false} // Income can also have category (e.g. Ready to Assign)
                    >
                        <option value="">{formData.type === 'income' ? 'Thu nhập cần phân bổ (Inflow)' : 'Chọn danh mục'}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.category_groups?.name} - {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng (Payee)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            value={formData.payee}
                            onChange={e => setFormData({ ...formData, payee: e.target.value })}
                            placeholder="VD: Vinmart"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        value={formData.memo}
                        onChange={e => setFormData({ ...formData, memo: e.target.value })}
                    />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu giao dịch'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
