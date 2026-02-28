// --- SHARED UTILITIES ---

/**
 * Format a number to Indian Rupees (INR)
 */
export const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

/**
 * Get the current real-world week number (1 or 2)
 * Useful for switching bi-weekly menu cycles
 */
export function getRealWorldWeek(): 1 | 2 {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDays = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    return weekNum % 2 === 0 ? 2 : 1;
}
