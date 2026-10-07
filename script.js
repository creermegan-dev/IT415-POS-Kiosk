const productList = document.getElementById("product-list");
const cartItems = document.getElementById("cart-items");
const cartEmptyMessage = document.getElementById("cart-empty");
const totalAmount = document.getElementById("total-amount");
const orderFeedback = document.getElementById("order-feedback");
const orderSummary = document.getElementById("order-summary");
const summaryItems = document.getElementById("summary-items");
const summaryTotalAmount = document.getElementById("summary-total-amount");
const summaryFeedback = document.getElementById("summary-feedback");
const productSelection = document.querySelector(".product-selection");
const orderCart = document.querySelector(".order-cart");
const paymentScreen = document.getElementById("payment-screen");
const paymentMethodOptions = document.getElementById("payment-method-options");
const paymentPanels = {
  cash: document.getElementById("cash-payment-panel"),
  qr: document.getElementById("qr-payment-panel"),
  card: document.getElementById("card-payment-panel")
};
const paymentMethodBackButton = document.getElementById("payment-method-back-button");
const paymentBackButton = document.getElementById("payment-back-button");
const paymentSuccess = document.getElementById("payment-success");
const paymentConfirmation = document.getElementById("payment-confirmation");
const receiptScreen = document.getElementById("receipt-screen");
const receiptItems = document.getElementById("receipt-items");
const transactionHistoryScreen = document.getElementById("transaction-history-screen");
const historyEmptyMessage = document.getElementById("history-empty");
const historyList = document.getElementById("history-list");
const historyDetail = document.getElementById("history-detail");
const historyDetailItems = document.getElementById("history-detail-items");

const SUPABASE_URL = "https://kncmtghtdiesbixkcyim.supabase.co";
const SUPABASE_KEY = "sb_publishable_pVPkW-UBjW2VV13pVTmf8g_KSPmLJD5";
const supabaseClient =
  SUPABASE_URL !== "MY_SUPABASE_PROJECT_URL" &&
  SUPABASE_KEY !== "MY_SUPABASE_PUBLISHABLE_KEY" &&
  typeof window.supabase?.createClient === "function"
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

const order = new Map();
const transactionHistory = [];
const paymentRecord = {
  databaseId: null,
  method: "",
  amountPaidInCents: 0,
  changeInCents: 0,
  transactionReference: "",
  transactionDate: "",
  totalInCents: 0,
  items: [],
  status: ""
};
let transactionSequence = 0;
let paymentCompletionStarted = false;

function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY to your project URL and publishable key."
    );
  }

  return supabaseClient;
}

function toCents(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    throw new Error("Supabase returned an invalid transaction amount.");
  }

  return Math.round(numericAmount * 100);
}

function formatPrice(priceInCents) {
  return `₱${(priceInCents / 100).toFixed(2)}`;
}

function addProduct(productButton) {
  const productId = productButton.dataset.productId;
  const productName = productButton.dataset.productName;
  const unitPrice = Number(productButton.dataset.productPrice);

  if (!productId || !productName || !Number.isFinite(unitPrice) || unitPrice < 0) {
    console.error("Cannot add product: its ID, name, or price is invalid.");
    return;
  }

  const existingProduct = order.get(productId);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    order.set(productId, {
      name: productName,
      unitPriceInCents: Math.round(unitPrice * 100),
      quantity: 1
    });
  }

  orderFeedback.hidden = true;
  orderFeedback.textContent = "";
  renderOrder();
}

function changeQuantity(productId, change) {
  const product = order.get(productId);

  if (!product) {
    return;
  }

  product.quantity += change;

  if (product.quantity <= 0) {
    order.delete(productId);
  }

  renderOrder();
}

function createCartButton(label, action, productName, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.className = className;
  button.setAttribute("aria-label", `${label} ${productName}`);
  return button;
}

function renderOrder() {
  cartItems.replaceChildren();
  cartEmptyMessage.hidden = order.size > 0;

  let totalInCents = 0;

  for (const [productId, product] of order) {
    const subtotalInCents = product.unitPriceInCents * product.quantity;
    totalInCents += subtotalInCents;

    const cartItem = document.createElement("li");
    cartItem.className = "cart-item";
    cartItem.dataset.productId = productId;

    const name = document.createElement("span");
    name.className = "cart-item-name";
    name.textContent = product.name;

    const quantity = document.createElement("span");
    quantity.className = "cart-item-quantity";
    quantity.textContent = `Quantity: ${product.quantity}`;

    const unitPrice = document.createElement("span");
    unitPrice.className = "cart-item-unit-price";
    unitPrice.textContent = `Unit price: ${formatPrice(product.unitPriceInCents)}`;

    const subtotal = document.createElement("span");
    subtotal.className = "cart-item-subtotal";
    subtotal.textContent = `Subtotal: ${formatPrice(subtotalInCents)}`;

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";
    controls.append(
      createCartButton("+", "increase", product.name, "quantity-button"),
      createCartButton("-", "decrease", product.name, "quantity-button"),
      createCartButton("Remove", "remove", product.name, "remove-button")
    );

    cartItem.append(name, quantity, unitPrice, subtotal, controls);
    cartItems.append(cartItem);
  }

  totalAmount.textContent = formatPrice(totalInCents);
}

function getOrderTotalInCents() {
  let totalInCents = 0;

  for (const product of order.values()) {
    totalInCents += product.unitPriceInCents * product.quantity;
  }

  return totalInCents;
}

function renderSummary() {
  summaryItems.replaceChildren();

  let totalInCents = 0;

  for (const [productId, product] of order) {
    const subtotalInCents = product.unitPriceInCents * product.quantity;
    totalInCents += subtotalInCents;

    const summaryItem = document.createElement("li");
    summaryItem.className = "summary-item";
    summaryItem.dataset.productId = productId;

    const name = document.createElement("span");
    name.className = "summary-item-name";
    name.textContent = product.name;

    const quantity = document.createElement("span");
    quantity.textContent = `Quantity: ${product.quantity}`;

    const unitPrice = document.createElement("span");
    unitPrice.textContent = `Unit price: ${formatPrice(product.unitPriceInCents)}`;

    const subtotal = document.createElement("span");
    subtotal.textContent = `Subtotal: ${formatPrice(subtotalInCents)}`;

    summaryItem.append(name, quantity, unitPrice, subtotal);
    summaryItems.append(summaryItem);
  }

  summaryTotalAmount.textContent = formatPrice(totalInCents);
}

function showOrderSummary() {
  if (order.size === 0) {
    orderFeedback.textContent = "Please add at least one item before viewing the order summary.";
    orderFeedback.hidden = false;
    orderFeedback.focus();
    return;
  }

  orderFeedback.hidden = true;
  orderFeedback.textContent = "";
  summaryFeedback.textContent = "";
  renderSummary();
  productSelection.hidden = true;
  orderCart.hidden = true;
  paymentScreen.hidden = true;
  paymentSuccess.hidden = true;
  orderSummary.hidden = false;
  document.getElementById("summary-heading").focus();
}

function returnToItemSelection() {
  orderSummary.hidden = true;
  paymentScreen.hidden = true;
  paymentSuccess.hidden = true;
  productSelection.hidden = false;
  orderCart.hidden = false;
  document.querySelector(".product-card").focus();
}

function showPaymentMethodOptions() {
  paymentMethodOptions.hidden = false;
  document.querySelector(".payment-navigation").append(paymentMethodBackButton);
  paymentMethodBackButton.hidden = true;
  paymentBackButton.hidden = false;

  for (const panel of Object.values(paymentPanels)) {
    panel.hidden = true;
  }
}

function showPaymentScreen() {
  if (order.size === 0) {
    summaryFeedback.textContent = "Please add at least one item before continuing to payment.";
    return;
  }

  summaryFeedback.textContent = "";
  orderSummary.hidden = true;
  productSelection.hidden = true;
  orderCart.hidden = true;
  paymentSuccess.hidden = true;
  paymentScreen.hidden = false;

  const total = formatPrice(getOrderTotalInCents());
  document.getElementById("payment-total-amount").textContent = total;

  for (const amount of document.querySelectorAll(".payment-total-value")) {
    amount.textContent = total;
  }

  document.getElementById("cash-amount").value = "";
  document.getElementById("cash-feedback").textContent = "";
  document.getElementById("cash-change").hidden = true;
  document.getElementById("cash-change-amount").textContent = formatPrice(0);
  document.getElementById("qr-feedback").textContent = "";
  document.getElementById("card-feedback").textContent = "";
  document.getElementById("process-card-button").disabled = false;
  paymentBackButton.disabled = false;
  paymentMethodBackButton.disabled = false;
  showPaymentMethodOptions();
  document.getElementById("payment-heading").focus();
}

function selectPaymentMethod(method) {
  paymentMethodOptions.hidden = true;
  paymentPanels[method].querySelector(".payment-panel-actions").append(paymentMethodBackButton);
  paymentMethodBackButton.hidden = false;
  paymentBackButton.hidden = true;

  for (const [methodName, panel] of Object.entries(paymentPanels)) {
    panel.hidden = methodName !== method;
  }

  const heading = paymentPanels[method].querySelector("h3");
  heading.focus();
}

function showPaymentSuccess() {
  orderSummary.hidden = true;
  productSelection.hidden = true;
  orderCart.hidden = true;
  paymentSuccess.hidden = false;
  paymentConfirmation.hidden = false;
  receiptScreen.hidden = true;

  document.getElementById("success-reference").textContent =
    paymentRecord.transactionReference;
  document.getElementById("success-total").textContent =
    formatPrice(paymentRecord.totalInCents);
  document.getElementById("receipt-payment-method").textContent = paymentRecord.method;
  document.getElementById("receipt-amount-paid").textContent =
    formatPrice(paymentRecord.amountPaidInCents);
  document.getElementById("receipt-change").textContent =
    formatPrice(paymentRecord.changeInCents);
  document.getElementById("payment-success-heading").focus();
}

function generateTransactionReference() {
  transactionSequence += 1;

  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `POS-${window.crypto.randomUUID()}`;
  }

  return `POS-${Date.now().toString(36).toUpperCase()}-${transactionSequence}`;
}

function renderReceipt() {
  receiptItems.replaceChildren();

  for (const product of paymentRecord.items) {
    const subtotalInCents = product.unitPriceInCents * product.quantity;
    const item = document.createElement("li");
    item.className = "receipt-item";
    const productButton = Array.from(
      productList.querySelectorAll(".product-card")
    ).find((candidate) => candidate.dataset.productName === product.name);

    if (!productButton) {
      console.error(`Cannot show product icon on receipt: "${product.name}" is unavailable.`);
    } else {
      item.dataset.productId = productButton.dataset.productId;
    }

    const name = document.createElement("span");
    name.className = "receipt-item-name";
    name.textContent = product.name;

    const quantity = document.createElement("span");
    quantity.textContent = `Quantity: ${product.quantity}`;

    const unitPrice = document.createElement("span");
    unitPrice.textContent = `Unit price: ${formatPrice(product.unitPriceInCents)}`;

    const subtotal = document.createElement("span");
    subtotal.textContent = `Subtotal: ${formatPrice(subtotalInCents)}`;

    item.append(name, quantity, unitPrice, subtotal);
    receiptItems.append(item);
  }

  document.getElementById("receipt-reference").textContent =
    paymentRecord.transactionReference;
  document.getElementById("receipt-date").textContent = paymentRecord.transactionDate;
  document.getElementById("receipt-total").textContent =
    formatPrice(paymentRecord.totalInCents);
  document.getElementById("receipt-method").textContent = paymentRecord.method;
  document.getElementById("receipt-paid").textContent =
    formatPrice(paymentRecord.amountPaidInCents);
  document.getElementById("receipt-change-amount").textContent =
    formatPrice(paymentRecord.changeInCents);
}

async function saveTransactionToSupabase(transaction) {
  const client = getSupabaseClient();
  const { data: savedTransaction, error: transactionError } = await client
    .from("transactions")
    .insert({
      transaction_code: transaction.transactionReference,
      payment_method: transaction.method,
      total_amount: transaction.totalInCents / 100
    })
    .select("id, transaction_code, created_at")
    .single();

  if (transactionError) {
    throw transactionError;
  }

  const transactionItems = transaction.items.map((product) => ({
    transaction_id: savedTransaction.id,
    product_name: product.name,
    quantity: product.quantity,
    unit_price: product.unitPriceInCents / 100,
    subtotal: (product.unitPriceInCents * product.quantity) / 100
  }));
  const { error: itemsError } = await client
    .from("transaction_items")
    .insert(transactionItems);

  if (itemsError) {
    throw itemsError;
  }

  return savedTransaction;
}

async function loadTransactionsFromSupabase() {
  const client = getSupabaseClient();
  const { data: transactions, error: transactionsError } = await client
    .from("transactions")
    .select("id, transaction_code, payment_method, total_amount, created_at")
    .order("created_at", { ascending: false });

  if (transactionsError) {
    throw transactionsError;
  }

  const transactionIds = transactions.map((transaction) => transaction.id);
  let itemsByTransaction = new Map();

  if (transactionIds.length > 0) {
    const { data: items, error: itemsError } = await client
      .from("transaction_items")
      .select("id, transaction_id, product_name, quantity, unit_price, subtotal")
      .in("transaction_id", transactionIds)
      .order("id", { ascending: true });

    if (itemsError) {
      console.error("Failed to load transaction items:", itemsError);
    } else {
      itemsByTransaction = new Map();
      for (const item of items) {
        const transactionItems = itemsByTransaction.get(item.transaction_id) || [];
        transactionItems.push({
          name: item.product_name,
          quantity: item.quantity,
          unitPriceInCents: toCents(item.unit_price)
        });
        itemsByTransaction.set(item.transaction_id, transactionItems);
      }
    }
  }

  const existingTransactions = new Map(
    transactionHistory
      .filter((transaction) => transaction.databaseId !== null)
      .map((transaction) => [transaction.databaseId, transaction])
  );
  const loadedTransactions = transactions.map((transaction) => {
    const existingTransaction = existingTransactions.get(transaction.id);
    const loadedItems = itemsByTransaction.get(transaction.id);

    return {
      ...existingTransaction,
      databaseId: transaction.id,
      transactionReference: transaction.transaction_code,
      method: transaction.payment_method,
      totalInCents: toCents(transaction.total_amount),
      transactionDate: new Date(transaction.created_at).toLocaleString(),
      amountPaidInCents: existingTransaction?.amountPaidInCents ?? null,
      changeInCents: existingTransaction?.changeInCents ?? null,
      status: existingTransaction?.status || "Payment Successful",
      items: loadedItems || existingTransaction?.items || []
    };
  });

  transactionHistory.splice(0, transactionHistory.length, ...loadedTransactions);
}

async function renderTransactionHistory() {
  historyList.replaceChildren();

  try {
    await loadTransactionsFromSupabase();
  } catch (error) {
    console.error("Failed to load transactions:", error);
  }

  historyEmptyMessage.hidden = transactionHistory.length > 0;

  transactionHistory.forEach((transaction, index) => {
    const listItem = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-entry-button";
    button.dataset.historyIndex = index;

    const reference = document.createElement("span");
    reference.className = "history-entry-reference";
    reference.textContent = transaction.transactionReference;
    reference.title = transaction.transactionReference;

    const date = document.createElement("span");
    date.className = "history-entry-date";
    date.textContent = transaction.transactionDate;

    const amount = document.createElement("span");
    amount.className = "history-entry-amount";
    amount.textContent = formatPrice(transaction.totalInCents);

    const method = document.createElement("span");
    method.className = "history-entry-method";
    method.textContent = transaction.method;

    const items = document.createElement("span");
    items.className = "history-entry-items";

    for (const product of transaction.items) {
      const productButton = Array.from(
        productList.querySelectorAll(".product-card")
      ).find((candidate) => candidate.dataset.productName === product.name);

      if (!productButton) {
        console.error(`Cannot show product icon in history: "${product.name}" is unavailable.`);
      }

      const item = document.createElement("span");
      item.className = "history-entry-product";
      if (productButton) {
        item.dataset.productId = productButton.dataset.productId;
      }
      item.textContent = `${product.name} × ${product.quantity}`;
      items.append(item);
    }

    button.append(reference, date, amount, method, items);
    listItem.append(button);
    historyList.append(listItem);
  });
}

async function showTransactionHistory() {
  await renderTransactionHistory();
  historyDetail.hidden = true;
  historyList.hidden = false;
  document.getElementById("history-back-button").hidden = false;
  transactionHistoryScreen.hidden = false;
  productSelection.hidden = true;
  orderCart.hidden = true;
  orderSummary.hidden = true;
  paymentScreen.hidden = true;
  paymentSuccess.hidden = true;
  document.getElementById("history-heading").focus();
}

async function showHistoryDetails(index) {
  const transaction = transactionHistory[index];

  if (!transaction) {
    console.error("Cannot show transaction: the selected history entry is unavailable.");
    return;
  }

  let products = transaction.items;
  if (transaction.databaseId !== null) {
    try {
      const client = getSupabaseClient();
      const { data: items, error } = await client
        .from("transaction_items")
        .select("product_name, quantity, unit_price")
        .eq("transaction_id", transaction.databaseId)
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      products = items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        unitPriceInCents: toCents(item.unit_price)
      }));
      transaction.items = products;
    } catch (error) {
      console.error("Failed to load transaction items:", error);
      if (products.length === 0) {
        return;
      }
    }
  }

  historyDetailItems.replaceChildren();

  for (const product of products) {
    const item = document.createElement("li");
    item.className = "receipt-item";

    const name = document.createElement("span");
    name.className = "receipt-item-name";
    name.textContent = product.name;

    const quantity = document.createElement("span");
    quantity.textContent = `Quantity: ${product.quantity}`;

    const unitPrice = document.createElement("span");
    unitPrice.textContent = `Unit price: ${formatPrice(product.unitPriceInCents)}`;

    const subtotal = document.createElement("span");
    subtotal.textContent =
      `Subtotal: ${formatPrice(product.unitPriceInCents * product.quantity)}`;

    item.append(name, quantity, unitPrice, subtotal);
    historyDetailItems.append(item);
  }

  document.getElementById("history-reference").textContent =
    transaction.transactionReference;
  document.getElementById("history-reference").title =
    transaction.transactionReference;
  document.getElementById("history-date").textContent = transaction.transactionDate;
  document.getElementById("history-total").textContent =
    formatPrice(transaction.totalInCents);
  document.getElementById("history-method").textContent = transaction.method;
  document.getElementById("history-paid").textContent =
    transaction.amountPaidInCents === null
      ? "Not recorded"
      : formatPrice(transaction.amountPaidInCents);
  document.getElementById("history-change").textContent =
    transaction.changeInCents === null
      ? "Not recorded"
      : formatPrice(transaction.changeInCents);
  document.getElementById("history-status").textContent = transaction.status;
  historyList.hidden = true;
  historyDetail.hidden = false;
  document.getElementById("history-back-button").hidden = true;
  document.getElementById("history-detail-heading").focus();
}

function returnToHistoryList() {
  historyDetail.hidden = true;
  historyList.hidden = false;
  document.getElementById("history-back-button").hidden = false;
  document.getElementById("history-heading").focus();
}

function returnToItemSelectionFromHistory() {
  transactionHistoryScreen.hidden = true;
  historyDetail.hidden = true;
  historyList.hidden = false;
  document.getElementById("history-back-button").hidden = false;
  productSelection.hidden = false;
  orderCart.hidden = false;
  document.querySelector(".product-card").focus();
}

async function completePayment(method, amountPaidInCents) {
  if (paymentCompletionStarted) {
    return;
  }

  paymentCompletionStarted = true;
  const totalInCents = getOrderTotalInCents();
  paymentRecord.databaseId = null;
  paymentRecord.method = method;
  paymentRecord.amountPaidInCents = amountPaidInCents;
  paymentRecord.changeInCents = Math.max(0, amountPaidInCents - totalInCents);
  paymentRecord.transactionReference = generateTransactionReference();
  paymentRecord.transactionDate = new Date().toLocaleString();
  paymentRecord.totalInCents = totalInCents;
  paymentRecord.items = Array.from(order.values(), (product) => ({ ...product }));
  paymentRecord.status = "Payment Successful";
  transactionHistory.unshift({
    ...paymentRecord,
    items: paymentRecord.items.map((product) => ({ ...product }))
  });

  try {
    const savedTransaction = await saveTransactionToSupabase(paymentRecord);
    paymentRecord.databaseId = savedTransaction.id;
    paymentRecord.transactionReference = savedTransaction.transaction_code;
    paymentRecord.transactionDate = new Date(savedTransaction.created_at).toLocaleString();
    Object.assign(transactionHistory[0], {
      databaseId: savedTransaction.id,
      transactionReference: savedTransaction.transaction_code,
      transactionDate: paymentRecord.transactionDate
    });
  } catch (error) {
    console.error("Failed to save transaction:", error);
  }

  showPaymentSuccess();
}

function showReceipt() {
  renderReceipt();
  receiptScreen.hidden = false;
  paymentSuccess.hidden = true;
  paymentScreen.hidden = true;
  document.getElementById("receipt-heading").focus();
}

function returnToPaymentSuccess() {
  receiptScreen.hidden = true;
  paymentScreen.hidden = false;
  paymentSuccess.hidden = false;
  paymentConfirmation.hidden = false;
  document.getElementById("payment-success-heading").focus();
}

function startNewTransaction() {
  order.clear();
  paymentCompletionStarted = false;
  Object.assign(paymentRecord, {
    databaseId: null,
    method: "",
    amountPaidInCents: 0,
    changeInCents: 0,
    transactionReference: "",
    transactionDate: "",
    totalInCents: 0,
    items: [],
    status: ""
  });

  transactionHistoryScreen.hidden = true;
  paymentSuccess.hidden = true;
  paymentConfirmation.hidden = false;
  receiptScreen.hidden = true;
  orderSummary.hidden = true;
  paymentScreen.hidden = true;
  productSelection.hidden = false;
  orderCart.hidden = false;
  summaryItems.replaceChildren();
  receiptItems.replaceChildren();

  document.getElementById("summary-total-amount").textContent = formatPrice(0);
  document.getElementById("payment-total-amount").textContent = formatPrice(0);
  document.getElementById("success-reference").textContent = "";
  document.getElementById("success-total").textContent = "";
  document.getElementById("receipt-payment-method").textContent = "";
  document.getElementById("receipt-amount-paid").textContent = "";
  document.getElementById("receipt-change").textContent = "";
  document.getElementById("receipt-reference").textContent = "";
  document.getElementById("receipt-date").textContent = "";
  document.getElementById("receipt-total").textContent = "";
  document.getElementById("receipt-method").textContent = "";
  document.getElementById("receipt-paid").textContent = "";
  document.getElementById("receipt-change-amount").textContent = "";
  document.getElementById("summary-feedback").textContent = "";
  document.getElementById("order-feedback").textContent = "";
  document.getElementById("order-feedback").hidden = true;
  document.getElementById("cash-amount").value = "";
  document.getElementById("cash-feedback").textContent = "";
  document.getElementById("cash-change").hidden = true;
  document.getElementById("cash-change-amount").textContent = formatPrice(0);
  document.getElementById("qr-feedback").textContent = "";
  document.getElementById("card-feedback").textContent = "";
  document.getElementById("process-card-button").disabled = false;
  paymentBackButton.disabled = false;
  paymentMethodBackButton.disabled = false;
  showPaymentMethodOptions();
  renderOrder();
  document.querySelector(".product-card").focus();
}

function handleCashPayment(event) {
  event.preventDefault();

  const input = document.getElementById("cash-amount");
  const feedback = document.getElementById("cash-feedback");
  const changeDisplay = document.getElementById("cash-change");
  const amountText = input.value.trim();
  feedback.textContent = "";
  changeDisplay.hidden = true;

  if (!amountText) {
    feedback.textContent = "Enter the amount paid.";
    input.focus();
    return;
  }

  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText)) {
    feedback.textContent = "Enter a valid, non-negative amount with up to two decimal places.";
    input.focus();
    return;
  }

  const amountPaidInCents = Math.round(Number(amountText) * 100);
  const totalInCents = getOrderTotalInCents();

  if (!Number.isSafeInteger(amountPaidInCents)) {
    feedback.textContent = "Enter a valid payment amount.";
    input.focus();
    return;
  }

  if (amountPaidInCents < totalInCents) {
    feedback.textContent = "Insufficient payment. The amount paid is less than the total due.";
    input.focus();
    return;
  }

  const changeInCents = amountPaidInCents - totalInCents;
  document.getElementById("cash-change-amount").textContent = formatPrice(changeInCents);
  changeDisplay.hidden = false;
  completePayment("Cash", amountPaidInCents);
}

function confirmQrPayment() {
  completePayment("QR Payment", getOrderTotalInCents());
}

function processCardPayment() {
  const processButton = document.getElementById("process-card-button");
  const feedback = document.getElementById("card-feedback");
  processButton.disabled = true;
  paymentBackButton.disabled = true;
  paymentMethodBackButton.disabled = true;
  feedback.textContent = "Processing card payment...";

  window.setTimeout(() => {
    processButton.disabled = false;
    paymentBackButton.disabled = false;
    paymentMethodBackButton.disabled = false;
    completePayment("Credit/Debit Card", getOrderTotalInCents());
  }, 1200);
}

productList.addEventListener("click", (event) => {
  const productButton = event.target.closest(".product-card");

  if (productButton && productList.contains(productButton)) {
    addProduct(productButton);
  }
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  const cartItem = button && button.closest(".cart-item");

  if (!button || !cartItem) {
    return;
  }

  const productId = cartItem.dataset.productId;

  if (button.dataset.action === "increase") {
    changeQuantity(productId, 1);
  } else if (button.dataset.action === "decrease") {
    changeQuantity(productId, -1);
  } else if (button.dataset.action === "remove") {
    order.delete(productId);
    renderOrder();
  }
});

document.getElementById("proceed-button").addEventListener("click", showOrderSummary);
document.getElementById("back-button").addEventListener("click", returnToItemSelection);
document.getElementById("continue-payment-button").addEventListener("click", showPaymentScreen);
paymentMethodOptions.addEventListener("click", (event) => {
  const methodButton = event.target.closest("[data-payment-method]");

  if (methodButton && paymentMethodOptions.contains(methodButton)) {
    selectPaymentMethod(methodButton.dataset.paymentMethod);
  }
});
paymentMethodBackButton.addEventListener("click", showPaymentMethodOptions);
paymentBackButton.addEventListener("click", () => {
  paymentScreen.hidden = true;
  showOrderSummary();
});
document.getElementById("cash-payment-form").addEventListener("submit", handleCashPayment);
document.getElementById("confirm-qr-button").addEventListener("click", confirmQrPayment);
document.getElementById("process-card-button").addEventListener("click", processCardPayment);
document.getElementById("view-receipt-button").addEventListener("click", showReceipt);
document.getElementById("back-to-success-button").addEventListener("click", returnToPaymentSuccess);
document.getElementById("new-transaction-button").addEventListener("click", startNewTransaction);
document.getElementById("transaction-history-button").addEventListener("click", showTransactionHistory);
historyList.addEventListener("click", (event) => {
  const transactionButton = event.target.closest("button[data-history-index]");

  if (transactionButton && historyList.contains(transactionButton)) {
    showHistoryDetails(Number(transactionButton.dataset.historyIndex));
  }
});
document.getElementById("history-list-back-button").addEventListener("click", returnToHistoryList);
document.getElementById("history-back-button").addEventListener("click", returnToItemSelectionFromHistory);

renderOrder();