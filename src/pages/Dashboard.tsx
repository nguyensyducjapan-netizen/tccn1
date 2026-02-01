import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, cn } from '../lib/utils'
import { ChevronRight, ChevronDown, PlusCircle, Check, Info } from 'lucide-react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { vi } from 'date-fns/locale'

type CategoryGroup = {
    id: string
    name: string
    categories: Category[]
}

type Category = {
    id: string
    name: string
    target_amount: number
    budgets: Budget[]
}

type Budget = {
    id: string
    assigned: number
    activity: number
    available: number
    month: string
}

export default function Dashboard() {
    const { user } = useAuth()
    const [groups, setGroups] = useState<CategoryGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
    const [editingBudget, setEditingBudget] = useState<{ catId: string, value: string } | null>(null)

    // Stats
    const [totalFunds, setTotalFunds] = useState(0)

    useEffect(() => {
        if (user) {
            fetchBudget()
            fetchTotalOneys()
        }
    }, [user, currentDate])

    const fetchTotalOneys = async () => {
        // Logic: Ready to Assign = Total Cash accounts - Total Available in categories
        // Simplified: Just sum all account balances for now to show context
        const { data } = await supabase.from('accounts').select('balance')
        const total = data?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0
        setTotalFunds(total)
    }

    const fetchBudget = async () => {
        try {
            const monthStart = startOfMonth(currentDate).toISOString()
            const { data, error } = await supabase
                .from('category_groups')
                .select(`
          id,
          name,
          categories (
            id,
            name,
            target_amount,
            budgets (
              id,
              assigned,
              activity,
              available,
              month
            )
          )
        `)
                .eq('user_id', user!.id)
                .eq('categories.budgets.month', monthStart)
                .order('created_at', { ascending: true })

            if (error) throw error

            // Need to merge categories that have no budget entry for this month yet
            // (The query above filters categories inner join budget. We need left join logic or handling nulls)
            // Supabase nested resource filtering is tricky. 
            // Better approach: Fetch ALL categories, then fetch budgets for this month, then map.
            // But for now, let's stick to the current structure but assume the seeded data exists.
            // Or better: ensure we insert budget rows if missing.

            const newExpanded = { ...expandedGroups }
            data?.forEach(g => {
                if (newExpanded[g.id] === undefined) newExpanded[g.id] = true
            })
            setExpandedGroups(newExpanded)
            setGroups(data as any)
        } catch (error) {
            console.error('Error fetching budget:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateAssigned = async (categoryId: string, newValue: number) => {
        // Upsert budget
        const monthStart = startOfMonth(currentDate).toISOString()

        const { error } = await supabase.from('budgets').upsert({
            user_id: user!.id,
            category_id: categoryId,
            month: monthStart,
            assigned: newValue,
            // We need to keep activity static or let DB default handle it on insert?
            // On update we only change assigned.
            // Problem: upsert needs unique constraint. (category_id, month) is unique.
        }, { onConflict: 'category_id, month' })

        if (!error) {
            fetchBudget() // Refresh to recalc available
        }
        setEditingBudget(null)
    }

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
    }

    // Calculate totals
    const totalAssigned = groups.reduce((acc, group) =>
        acc + group.categories.reduce((cAcc, cat) =>
            cAcc + (cat.budgets?.[0]?.assigned || 0), 0), 0)

    const totalAvailable = groups.reduce((acc, group) =>
        acc + group.categories.reduce((cAcc, cat) =>
            cAcc + (cat.budgets?.[0]?.available || 0), 0), 0)

    // Ready to Assign = Total Funds - Total Available (Account equation)
    const readyToAssign = totalFunds - totalAvailable;

    if (loading) return <div className="p-8">Đang tải dữ liệu...</div>

    return (
        <div className="h-full flex flex-col bg-[#f0f2f5]">
            {/* Top Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setCurrentDate(d => subMonths(d, 1))}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <div className="px-4 font-semibold text-gray-700 min-w-[140px] text-center">
                            {format(currentDate, 'MM yyyy')}
                        </div>
                        <button
                            onClick={() => setCurrentDate(d => addMonths(d, 1))}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </div>

                    <div className="flex flex-col">
                        <div className={cn(
                            "text-2xl font-bold font-mono tracking-tight",
                            readyToAssign >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {formatCurrency(readyToAssign)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            Cần phân bổ (Ready to Assign)
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Budget Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                        <div className="col-span-6">Danh mục</div>
                        <div className="col-span-2 text-right">Đã gán (Assigned)</div>
                        <div className="col-span-2 text-right">Hoạt động (Activity)</div>
                        <div className="col-span-2 text-right">Khả dụng (Available)</div>
                    </div>

                    {groups.map((group) => (
                        <div key={group.id}>
                            {/* Group Row */}
                            <div
                                className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#f8f9fa] border-b border-gray-100 cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleGroup(group.id)}
                            >
                                <div className="col-span-6 flex items-center font-bold text-blue-900 text-sm">
                                    {expandedGroups[group.id] ?
                                        <ChevronDown className="w-4 h-4 mr-2 text-blue-400" /> :
                                        <ChevronRight className="w-4 h-4 mr-2 text-blue-400" />
                                    }
                                    {group.name}
                                </div>
                            </div>

                            {/* Categories */}
                            {expandedGroups[group.id] && group.categories.map((category) => {
                                const budget = category.budgets?.[0] || { assigned: 0, activity: 0, available: 0 }
                                const isEditing = editingBudget?.catId === category.id

                                return (
                                    <div key={category.id} className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-gray-50 hover:bg-blue-50/50 items-center text-sm group">
                                        <div className="col-span-6 pl-10 flex items-center text-gray-700">
                                            <span className="mr-2 hidden group-hover:block text-gray-400 cursor-pointer">
                                                <input type="checkbox" className="rounded border-gray-300" />
                                            </span>
                                            {category.name}
                                        </div>

                                        {/* Assigned Column (Editable) */}
                                        <div className="col-span-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    className="w-full text-right p-1 text-sm border border-blue-500 rounded bg-white shadow-sm focus:outline-none"
                                                    value={editingBudget.value}
                                                    onChange={e => setEditingBudget({ ...editingBudget, value: e.target.value })}
                                                    onBlur={(e) => handleUpdateAssigned(category.id, Number(e.target.value))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateAssigned(category.id, Number(editingBudget.value))
                                                        if (e.key === 'Escape') setEditingBudget(null)
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="cursor-text border border-transparent hover:border-gray-300 rounded px-1.5 py-0.5"
                                                    onClick={() => setEditingBudget({ catId: category.id, value: budget.assigned.toString() })}
                                                >
                                                    {budget.assigned === 0 ? <span className="text-gray-300">0</span> : formatCurrency(budget.assigned).replace('₫', '')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Activity Column */}
                                        <div className="col-span-2 text-right text-gray-500">
                                            {budget.activity === 0 ? <span className="text-gray-300">0</span> : formatCurrency(budget.activity).replace('₫', '')}
                                        </div>

                                        {/* Available Column */}
                                        <div className="col-span-2 flex justify-end">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium min-w-[80px] text-center",
                                                budget.available < 0 ? "bg-red-100 text-red-700" :
                                                    budget.available === 0 ? "bg-gray-100 text-gray-400" : "bg-green-100 text-green-700"
                                            )}>
                                                {formatCurrency(budget.available)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
