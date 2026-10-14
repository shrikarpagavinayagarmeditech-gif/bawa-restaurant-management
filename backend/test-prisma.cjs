const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Prisma models...");

    console.log("FoodItem:", typeof prisma.foodItem);
    console.log("Category:", typeof prisma.category);
    console.log("Branch:", typeof prisma.branch);
    console.log("BranchFoodRate:", typeof prisma.branchFoodRate);

    if (!prisma.foodItem) {
        console.error("❌ FoodItem model is missing!");
        return;
    }

    const foodItems = await prisma.foodItem.findMany({
        take: 5,
    });

    console.log("✅ Food items:", foodItems);
}

main()
    .catch((error) => {
        console.error("❌ Prisma error:", error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });