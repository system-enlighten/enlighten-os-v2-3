import { createHash } from "node:crypto";

// Account heads and validation ported from Accounts.gs and AccountsTransactions.gs.

export const ACCOUNTS_HEADS = [
  ["Cash", "Asset"],
  ["IDFC", "Asset"],
  ["Accounts Receivable", "Asset"],
  ["Employee Advances", "Asset"],
  ["Fixed Assets", "Asset"],
  ["Intercompany Clearing", "Asset"],
  ["Suspense Clearing", "Asset"],
  ["Accounts Payable", "Liability"],
  ["Loan", "Liability"],
  ["Payroll Payable", "Liability"],
  ["GST Composition Payable", "Liability"],
  ["Payroll Deductions Payable", "Liability"],
  ["Advance from Customers", "Liability"],
  ["Capital", "Equity"],
  ["Drawings", "Equity"],
  ["Design Fees", "Revenue"],
  ["Direct Project Costs", "Direct expense"],
  ["Studio Overheads", "Expense"],
  ["Salary and Wages", "Expense"],
  ["Bank Charges", "Expense"],
  ["GST Composition Expense", "Expense"],
  ["Software Subscription", "Expense"],
];
export const ACCOUNTS_LEGACY_HEADS = [
  ["Building Renovation", "Asset", ""],
  ["Building Renovation | POP | Material", "Asset", ""],
  ["Building Renovation | POP | Contracter", "Asset", ""],
  [
    "Building Renovation | Electrical | Material",
    "Asset",
    "Electrical | Material",
  ],
  [
    "Building Renovation | Electrical | Contracter",
    "Asset",
    "Electrical | Contracter",
  ],
  ["Building Renovation | Stone | Material", "Asset", "Stone | Material"],
  ["Building Renovation | Stone | Contracter", "Asset", "Stone | Contracter"],
  [
    "Building Renovation | Furniture | Material",
    "Asset",
    "Furniture | Material",
  ],
  [
    "Building Renovation | Furniture | Contracter",
    "Asset",
    "Furniture | Contracter",
  ],
  ["Building Renovation | Paint | Material", "Asset", "Paint | Material"],
  ["Building Renovation | Paint | Contracter", "Asset", ""],
  ["Building Renovation | Plumbing | Material", "Asset", "Plumbing | Material"],
  ["Building Renovation | Plumbing | Contracter", "Asset", ""],
  ["Building Renovation | Civil | Material", "Asset", "Civil | Material"],
  ["Building Renovation | Civil | Contracter", "Asset", "Civil | Contracter"],
  ["Building Renovation | HVAC | Material", "Asset", "HVAC | Material"],
  ["Building Renovation | HVAC | Contracter", "Asset", "HVAC | Contracter"],
  ["Hardware & Software", "Asset", ""],
  ["Security Deposit", "Asset", ""],
  ["Fixed Deposit", "Asset", ""],
  ["Imprest | Pradeep", "Asset", ""],
  ["Imprest | Pankaj", "Asset", ""],
  ["Imprest | Rajesh ji", "Asset", ""],
  ["Input CGST", "Asset", ""],
  ["Input SGST", "Asset", ""],
  ["Input IGST", "Asset", ""],
  ["TDS Recievable", "Asset", ""],
  ["Output CGST", "Liability", ""],
  ["Output SGST", "Liability", ""],
  ["Output IGST", "Liability", ""],
  ["Capital from Partner", "Equity", ""],
  ["Personal Drawings", "Equity", ""],
  ["Personal Drawings | Alld Expenses", "Equity", "Alld Expenses"],
  ["Personal Drawings | Flat 29 Expenses", "Equity", "Flat 29 Expenses"],
  ["Personal Drawings | Travel", "Equity", "Travel"],
  ["Personal Drawings | Meal", "Equity", "Meal"],
  ["Personal Drawings | Other", "Equity", "Other"],
  ["Design Services Income", "Revenue", ""],
  ["Project Commissioning Income", "Revenue", ""],
  ["Income | Installation Charges", "Revenue", ""],
  ["Employee Recovery", "Revenue", ""],
  ["Site Visit | Flight/Train/Bus", "Direct expense", ""],
  ["Site Visit | Uber/Rapido/Metro", "Direct expense", ""],
  ["Site Visit | Hotel", "Direct expense", ""],
  ["Site Visit | Meal", "Direct expense", ""],
  ["Site Visit | Petrol", "Direct expense", ""],
  ["Site Visit | Others", "Direct expense", ""],
  ["Salary Paid", "Expense", ""],
  ["Office Supplies | House Keeping", "Expense", ""],
  ["Office Supplies | Stationary", "Expense", ""],
  ["Office Supplies |Telephone Expense", "Expense", ""],
  ["Office Supplies |Other", "Expense", ""],
  ["Daily Essentials | Milk", "Expense", ""],
  ["Daily Essentials | Water Bottle", "Expense", ""],
  ["Daily Essentials | Kitchen/Meals", "Expense", ""],
  ["Rent", "Expense", ""],
  ["Service & Maintainance", "Expense", ""],
  ["Electricity", "Expense", ""],
  ["Outward Frieght - Local [Air/Surface/Porter]", "Expense", ""],
  [
    "Outward Frieght - Local [Air/Surface/Porter] | Porter | Mockup",
    "Expense",
    "Porter | Mockup",
  ],
  ["Business Travel | IN", "Expense", "Visa & Travel Documentation"],
  ["Business Travel", "Expense", "Flight Ticket"],
  [
    "Business Travel | Exhibition & Trade Fair Expenses",
    "Expense",
    "Exhibition & Trade Fair Expenses",
  ],
];
const ACCOUNTS_CASH = ["Cash", "IDFC"];

function accountsText_(value, limit = 250) {
  return String(value ?? "")
    .trim()
    .slice(0, limit);
}

function accountsDate_(value) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw Error("Enter a valid date.");
  return value;
}

function accountsMoney_(value, zero = false) {
  const s = String(value ?? "")
    .trim()
    .replace(/,/g, "");
  if (!s && zero) return 0;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(s))
    throw Error("Enter an INR amount with up to two decimal places.");
  const n = Math.round(Number(s) * 100);
  if (!zero && !n) throw Error("Amount must be greater than zero.");
  return n;
}

export function accountsTransactionHash_(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

// Older imports copied a submission timestamp into the optional source ID.
export function accountsTransactionSourceId_(record) {
  const id = String(record.sourceId || "").trim();
  if (!record.sourceRow || !id) return id;
  const isTimestamp =
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) [A-Z][a-z]{2} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}/.test(
      id,
    ) || /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}(?:[ T]\d{1,2}:\d{2}|$)/.test(id);
  return isTimestamp && id === String(record.sourceSubmittedAt || "").trim()
    ? ""
    : id;
}
export function accountsTransactionFingerprint_(r) {
  const n = (v) =>
    String(v || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  return accountsTransactionHash_([
    r.date,
    n(r.bank),
    r.direction,
    r.amount,
    n(r.projectId),
    n(r.head),
    n(r.description),
    n(r.reference),
    n(r.beneficiary),
    n(r.billNumber),
    n(accountsTransactionSourceId_(r)),
  ]);
}
export function buildDesignTransaction(p, data, user) {
  const id = String(p.id || "");
  if (!/^[a-zA-Z0-9-]{12,100}$/.test(id))
    throw Error("Invalid transaction ID.");
  if (p.company && p.company !== "Design")
    throw Error("Only Design transactions can be imported.");
  const date = accountsDate_(p.date),
    bank = accountsText_(p.bank),
    direction = accountsText_(p.direction),
    amount = accountsMoney_(p.amount),
    head = accountsText_(p.head),
    account = data.heads.find((h) => h[0] === head);
  const contra = p.entryType === "Contra";
  const from = accountsText_(p.fromAccount),
    to = accountsText_(p.toAccount);
  if (
    contra &&
    (!ACCOUNTS_CASH.includes(from) ||
      !ACCOUNTS_CASH.includes(to) ||
      from === to)
  )
    throw Error("Choose two different cash / bank accounts for Contra.");
  if (
    !contra &&
    (!ACCOUNTS_CASH.includes(bank) ||
      !["Inflow", "Outflow"].includes(direction) ||
      !account)
  )
    throw Error("Choose bank, debit/credit and payment head.");
  if (
    !contra &&
    [
      "Intercompany Clearing",
      "Accounts Receivable",
      "Employee Advances",
    ].includes(head)
  )
    throw Error(
      "Use the dedicated invoice receipt / employee advance workflow for " +
        head +
        ".",
    );
  if (!contra && (head === bank || ACCOUNTS_CASH.includes(head)))
    throw Error("Transfers between accounts are not supported here.");
  if (
    !contra &&
    ((direction === "Inflow" &&
      ["Direct expense", "Expense"].includes(account[1])) ||
      (direction === "Outflow" && account[1] === "Revenue"))
  )
    throw Error("Payment head does not match debit / credit.");
  const projectId = accountsText_(p.projectId),
    project = data.projects.find((r) => r.id === projectId);
  if (projectId && !project) throw Error("Unknown project.");
  if (p.projectName && !projectId)
    throw Error("Map the project before importing.");
  const record = {
    id,
    kind: "transaction",
    date,
    valueDate: date,
    company: "Design",
    projectId,
    projectName: project?.name || "",
    bank,
    direction,
    amount,
    head,
    description: accountsText_(p.description, 1200),
    paymentMode: accountsText_(p.paymentMode),
    beneficiary: accountsText_(p.beneficiary),
    billNumber: accountsText_(p.billNumber),
    paymentType: accountsText_(p.paymentType),
    reference: accountsText_(p.reference),
    sourceId: accountsText_(p.sourceId),
    sourceLabel: accountsText_(p.sourceLabel),
    sourceSubmittedAt: accountsText_(p.sourceSubmittedAt),
    sourceEmail: accountsText_(p.sourceEmail),
    sourceRow: Number(p.sourceRow) || 0,
    author: user.email,
    createdAt: new Date().toISOString(),
    postings:
      direction === "Inflow"
        ? [
            { head: bank, debit: amount, credit: 0 },
            { head, debit: 0, credit: amount },
          ]
        : [
            { head, debit: amount, credit: 0 },
            { head: bank, debit: 0, credit: amount },
          ],
  };
  if (contra) {
    record.entryType = "Contra";
    record.fromAccount = from;
    record.toAccount = to;
    record.bank = from === "Cash" ? to : from;
    record.direction = to === record.bank ? "Inflow" : "Outflow";
    record.head = "Cash";
    record.paymentMode = "Cash transfer";
    record.paymentType = "";
    record.postings = [
      { head: to, debit: amount, credit: 0 },
      { head: from, debit: 0, credit: amount },
    ];
  }
  if (
    record.paymentType &&
    !/^(partial|full)( payment)?$/i.test(record.paymentType)
  )
    throw Error("Choose Partial payment or Full payment.");
  if (!record.paymentMode) throw Error("Enter payment mode.");
  const url = String(p.attachmentUrl || "").trim();
  if (url && (!/^https:\/\/[^\s]+$/.test(url) || url.length > 2000))
    throw Error("Use a valid HTTPS attachment link.");
  record.attachmentUrl = url;
  if (p.attachmentId) {
    const attachment = data.attachments.get(String(p.attachmentId));
    if (
      !attachment ||
      String(attachment.transactionId) !== id ||
      attachment.author !== user.email
    )
      throw Error("Payment attachment does not belong to this transaction.");
    record.attachmentId = String(p.attachmentId);
  }
  record.sourceFingerprint = accountsTransactionFingerprint_(record);
  return record;
}
