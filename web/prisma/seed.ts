import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create user
    const user = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            name: 'Mic',
        },
    });

    console.log('User created:', user.id);

    // Create events
    await prisma.event.createMany({
        data: [
            {
                title: 'Team Meeting',
                startTime: new Date(new Date().setHours(10, 0, 0, 0)),
                endTime: new Date(new Date().setHours(11, 0, 0, 0)),
                location: 'Office',
                userId: user.id,
            },
            {
                title: 'Lunch with Daniel',
                startTime: new Date(new Date().setHours(12, 30, 0, 0)),
                endTime: new Date(new Date().setHours(13, 30, 0, 0)),
                location: 'Vapiano',
                userId: user.id,
            },
            {
                title: 'Project Review',
                startTime: new Date(new Date().setHours(15, 0, 0, 0)),
                endTime: new Date(new Date().setHours(16, 0, 0, 0)),
                location: 'Zoom',
                userId: user.id,
            },
        ],
    });

    console.log('Events created');

    // Create transactions
    await prisma.transaction.createMany({
        data: [
            {
                amount: 1200,
                type: 'expense',
                category: 'Rent',
                description: 'Monthly Rent',
                isPaid: true,
                userId: user.id,
            },
            {
                amount: 45.90,
                type: 'expense',
                category: 'Groceries',
                description: 'Rewe',
                isPaid: true,
                userId: user.id,
            },
            {
                amount: 3500,
                type: 'income',
                category: 'Salary',
                description: 'Monthly Salary',
                isPaid: true,
                userId: user.id,
            },
        ],
    });

    console.log('Transactions created');

    // Create shopping items
    await prisma.shoppingItem.createMany({
        data: [
            { name: 'Milk', isChecked: false, userId: user.id },
            { name: 'Coffee', isChecked: true, userId: user.id },
            { name: 'Bananas', isChecked: false, userId: user.id },
        ],
    });

    console.log('Shopping items created');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
