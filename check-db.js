const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.stockBatch.count();
  console.log('Total batches:', count);

  if (count > 0) {
    const sample = await prisma.stockBatch.findFirst({ include: { stockItem: true } });
    console.log('Sample batch stockItemId:', sample.stockItemId);
    console.log('Sample stockItem name:', sample?.stockItem?.name);

    const oldest = await prisma.stockBatch.findFirst({ orderBy: { receivedDate: 'asc' } });
    const newest = await prisma.stockBatch.findFirst({ orderBy: { receivedDate: 'desc' } });
    console.log('Oldest batch:', oldest?.receivedDate);
    console.log('Newest batch:', newest?.receivedDate);

    const byId = await prisma.stockBatch.groupBy({ by: ['stockItemId'], _count: true });
    console.log('Batches by stockItemId:', byId);
  }

  const items = await prisma.stockItem.findMany({ select: { id: true, name: true } });
  console.log('StockItems:');
  items.forEach(i => console.log(' ', i.name, '->', i.id));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
