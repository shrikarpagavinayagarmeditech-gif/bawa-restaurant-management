

/**
 * Generate the next invoice number for a branch.
 *
 * Example:
 * SEP-26-00001
 * SEP-26-00002
 */
export async function generateInvoiceNumber(tx, branchId, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const monthCode = date
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();

  const yearCode = String(year).slice(-2);

  const sequence = await tx.invoiceSequence.upsert({
    where: {
      branchId_year_month: {
        branchId,
        year,
        month,
      },
    },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      branchId,
      year,
      month,
      lastNumber: 1,
    },
  });

  const number = String(sequence.lastNumber).padStart(5, "0");

  return `${monthCode}-${yearCode}-${number}`;
}

/**
 * Generate the next hold number for a branch.
 *
 * Example:
 * H-001
 * H-002
 * H-003
 */

export async function generateHoldNumber(tx, branchId, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const sequence = await tx.holdsequence.upsert({
    where: {
      branchId_year_month: {
        branchId,
        year,
        month,
      },
    },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      branchId,
      year,
      month,
      lastNumber: 1,
    },
  });

  const number = String(sequence.lastNumber).padStart(3, "0");

  return `H-${number}`;
}
