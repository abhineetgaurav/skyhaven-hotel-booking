import crypto from "crypto";

// ---------------------------------------------------------------------------
// SIMULATED payment gateway (demo mode). No money moves and nothing is sent to
// a bank. To go live, replace `charge()` with a call to a real gateway such as
// Razorpay (UPI, cards and netbanking) and keep the same return shape.
//
// Test triggers:
//   Card       number ending 0002 -> declined, ending 9995 -> insufficient funds
//   UPI        id containing "fail" -> declined, "timeout" -> expired
//   Netbanking "Demo Bank (always fails)"
// ---------------------------------------------------------------------------
export const METHODS = ["UPI", "Card", "Netbanking"];
export const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Yes Bank", "Demo Bank (always fails)"];

const luhn = num => {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) { let d = +num[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; }
  return sum % 10 === 0;
};

// Returns { errors: [{field,message}], clean }. `clean` is what the gateway needs; CVV is never kept.
export function validatePaymentInput(b) {
  const errors = [], err = (field, message) => errors.push({ field, message });
  if (!METHODS.includes(b.method)) { err("method", "Choose UPI, card or internet banking."); return { errors }; }
  if (b.method === "UPI") {
    const upiId = String(b.upiId || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,64}@[a-z]{2,32}$/.test(upiId)) err("upiId", "Enter a valid UPI ID, like name@bank.");
    return { errors, clean: { upiId } };
  }
  if (b.method === "Netbanking") {
    if (!BANKS.includes(b.bank)) err("bank", "Select your bank.");
    return { errors, clean: { bank: b.bank } };
  }
  const num = String(b.cardNumber || "").replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(num) || !luhn(num)) err("cardNumber", "Enter a valid card number.");
  if (String(b.cardName || "").trim().length < 2) err("cardName", "Enter the name on the card.");
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(b.expiry || "").trim());
  if (!m || +m[1] < 1 || +m[1] > 12) err("expiry", "Use MM/YY.");
  else if (new Date(2000 + +m[2], +m[1], 1) <= new Date()) err("expiry", "This card has expired.");
  if (!/^\d{3,4}$/.test(String(b.cvv || ""))) err("cvv", "Enter the 3 or 4 digit CVV.");
  return { errors, clean: { number: num } };
}

export async function charge({ method, clean, amount }) {
  await new Promise(r => setTimeout(r, 900)); // simulate a gateway round-trip
  const fail = reason => ({ ok: false, reason });
  if (method === "Card") {
    if (clean.number.endsWith("0002")) return fail("Your card was declined by the issuing bank.");
    if (clean.number.endsWith("9995")) return fail("Insufficient funds on this card.");
  }
  if (method === "UPI") {
    if (clean.upiId.includes("fail")) return fail("The UPI request was declined.");
    if (clean.upiId.includes("timeout")) return fail("The UPI request expired. Approve it in your UPI app within 5 minutes.");
  }
  if (method === "Netbanking" && clean.bank.includes("always fails")) return fail("Your bank's internet banking service is unavailable right now.");
  const label = method === "Card" ? `Card ••••${clean.number.slice(-4)}` : method === "UPI" ? `UPI ${clean.upiId}` : `Netbanking – ${clean.bank}`;
  return { ok: true, transactionId: "SH" + crypto.randomBytes(5).toString("hex").toUpperCase(), label, amount };
}
