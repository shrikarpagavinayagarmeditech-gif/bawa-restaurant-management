// import { PrismaClient, Role } from '@prisma/client';
// import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// async function main() {
//   // =========================================================
//   // ADMIN USER
//   // =========================================================

//   const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

//   await prisma.user.upsert({
//     where: {
//       username: 'admin',
//     },
//     update: {
//       passwordHash: adminPasswordHash,
//       active: true,
//       role: Role.ADMIN,
//       branchId: null,
//     },
//     create: {
//       username: 'admin',
//       passwordHash: adminPasswordHash,
//       role: Role.ADMIN,
//       active: true,
//     },
//   });

//   // =========================================================
//   // CATEGORIES
//   // =========================================================

//   const veg = await prisma.category.upsert({
//     where: {
//       name: 'Veg',
//     },
//     update: {
//       active: true,
//     },
//     create: {
//       name: 'Veg',
//       active: true,
//     },
//   });

//   const nonveg = await prisma.category.upsert({
//     where: {
//       name: 'Non-Veg',
//     },
//     update: {
//       active: true,
//     },
//     create: {
//       name: 'Non-Veg',
//       active: true,
//     },
//   });

//   await prisma.category.upsert({
//     where: {
//       name: 'Beverages',
//     },
//     update: {
//       active: true,
//     },
//     create: {
//       name: 'Beverages',
//       active: true,
//     },
//   });

//   // =========================================================
//   // BRANCHES
//   // =========================================================

//   const b1 = await prisma.branch.upsert({
//     where: {
//       id: 'seed-branch-1',
//     },
//     update: {
//       name: 'Main Branch',
//       address: 'Main Road',
//       phone: '9000000001',
//       gstNumber: 'GST-001',
//     },
//     create: {
//       id: 'seed-branch-1',
//       name: 'Main Branch',
//       address: 'Main Road',
//       phone: '9000000001',
//       gstNumber: 'GST-001',
//     },
//   });

//   const b2 = await prisma.branch.upsert({
//     where: {
//       id: 'seed-branch-2',
//     },
//     update: {
//       name: 'Second Branch',
//       address: 'Market Road',
//       phone: '9000000002',
//       gstNumber: 'GST-002',
//     },
//     create: {
//       id: 'seed-branch-2',
//       name: 'Second Branch',
//       address: 'Market Road',
//       phone: '9000000002',
//       gstNumber: 'GST-002',
//     },
//   });

//   // =========================================================
//   // BRANCH USERS
//   // =========================================================

//   const branchPasswordHash = await bcrypt.hash('Branch@123', 10);

//   await prisma.user.upsert({
//     where: {
//       username: 'mainbranch',
//     },
//     update: {
//       passwordHash: branchPasswordHash,
//       branchId: b1.id,
//       role: Role.BRANCH,
//       active: true,
//     },
//     create: {
//       username: 'mainbranch',
//       passwordHash: branchPasswordHash,
//       role: Role.BRANCH,
//       branchId: b1.id,
//       active: true,
//     },
//   });

//   await prisma.user.upsert({
//     where: {
//       username: 'secondbranch',
//     },
//     update: {
//       passwordHash: branchPasswordHash,
//       branchId: b2.id,
//       role: Role.BRANCH,
//       active: true,
//     },
//     create: {
//       username: 'secondbranch',
//       passwordHash: branchPasswordHash,
//       role: Role.BRANCH,
//       branchId: b2.id,
//       active: true,
//     },
//   });

//   // =========================================================
//   // SHIFTS
//   // =========================================================

//   await prisma.shift.upsert({
//     where: {
//       id: 'seed-shift-morning',
//     },
//     update: {
//       name: 'Morning',
//       startTime: '06:00',
//       endTime: '12:00',
//       active: true,
//     },
//     create: {
//       id: 'seed-shift-morning',
//       name: 'Morning',
//       startTime: '06:00',
//       endTime: '12:00',
//       active: true,
//     },
//   });

//   await prisma.shift.upsert({
//     where: {
//       id: 'seed-shift-afternoon',
//     },
//     update: {
//       name: 'Afternoon',
//       startTime: '12:00',
//       endTime: '16:00',
//       active: true,
//     },
//     create: {
//       id: 'seed-shift-afternoon',
//       name: 'Afternoon',
//       startTime: '12:00',
//       endTime: '16:00',
//       active: true,
//     },
//   });

//   await prisma.shift.upsert({
//     where: {
//       id: 'seed-shift-evening',
//     },
//     update: {
//       name: 'Evening',
//       startTime: '16:00',
//       endTime: '22:00',
//       active: true,
//     },
//     create: {
//       id: 'seed-shift-evening',
//       name: 'Evening',
//       startTime: '16:00',
//       endTime: '22:00',
//       active: true,
//     },
//   });

//   // =========================================================
//   // FOOD ITEMS
//   // =========================================================

//   const chickenBiryani = await prisma.foodItem.upsert({
//     where: {
//       id: 'seed-chicken-biryani',
//     },
//     update: {
//       name: 'Chicken Biryani',
//       categoryId: nonveg.id,
//       rate: 200,
//       description: 'Signature biryani',
//     },
//     create: {
//       id: 'seed-chicken-biryani',
//       name: 'Chicken Biryani',
//       categoryId: nonveg.id,
//       rate: 200,
//       description: 'Signature biryani',
//     },
//   });

//   await prisma.foodItem.upsert({
//     where: {
//       id: 'seed-paneer-rice',
//     },
//     update: {
//       name: 'Paneer Rice',
//       categoryId: veg.id,
//       rate: 160,
//       description: 'Vegetarian rice',
//     },
//     create: {
//       id: 'seed-paneer-rice',
//       name: 'Paneer Rice',
//       categoryId: veg.id,
//       rate: 160,
//       description: 'Vegetarian rice',
//     },
//   });

//   // =========================================================
//   // BRANCH-SPECIFIC FOOD RATE
//   // =========================================================

//   await prisma.branchFoodRate.upsert({
//     where: {
//       branchId_foodItemId: {
//         branchId: b1.id,
//         foodItemId: chickenBiryani.id,
//       },
//     },
//     update: {
//       rate: 220,
//     },
//     create: {
//       branchId: b1.id,
//       foodItemId: chickenBiryani.id,
//       rate: 220,
//     },
//   });

//   // =========================================================
//   // SUCCESS
//   // =========================================================

//   console.log('');
//   console.log('==============================================');
//   console.log('        BAWA RESTAURANT SEED COMPLETE        ');
//   console.log('==============================================');
//   console.log('');
//   console.log('ADMIN LOGIN');
//   console.log('Username : admin');
//   console.log('Password : Admin@123');
//   console.log('');
//   console.log('BRANCH 1 LOGIN');
//   console.log('Username : mainbranch');
//   console.log('Password : Branch@123');
//   console.log('');
//   console.log('BRANCH 2 LOGIN');
//   console.log('Username : secondbranch');
//   console.log('Password : Branch@123');
//   console.log('');
//   console.log('Branches : 2');
//   console.log('Categories : 3');
//   console.log('Shifts : 3');
//   console.log('Food Items : 2');
//   console.log('');
//   console.log('==============================================');
// }

// main()
//   .catch((error) => {
//     console.error('');
//     console.error('SEED FAILED');
//     console.error(error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {
      passwordHash,
      role: "ADMIN",
      active: true,
      branchId: null,
    },
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  console.log("Admin created successfully");
  console.log({
    id: admin.id,
    username: admin.username,
    role: admin.role,
  });
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

