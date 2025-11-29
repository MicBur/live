export interface User {
    id: string;
    email: string;
    name?: string | null;
}

export interface Event {
    id: string;
    title: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
    location?: string | null;
    isAllDay: boolean;
    userId: string;
}

export interface Transaction {
    id: string;
    amount: number;
    currency: string;
    type: 'income' | 'expense';
    category: string;
    description?: string | null;
    date: Date;
    dueDate?: Date | null;
    isPaid: boolean;
    userId: string;
}

export interface ShoppingItem {
    id: string;
    name: string;
    quantity?: string | null;
    isChecked: boolean;
    userId: string;
}

export interface HealthLog {
    id: string;
    type: string;
    value: string;
    date: Date;
    userId: string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}
