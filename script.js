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

const order = new Map();
const paymentRecord = {
  method: "",
  amountPaidInCents: 0,
  changeInCents: 0,
  transactionReference: "",
  transactionDate: "",
  totalInCents: 0,
  items: []
};
let transactionSequence = 0;

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

  for (const product of order.values()) {
    const subtotalInCents = product.unitPriceInCents * product.quantity;
    totalInCents += subtotalInCents;

    const summaryItem = document.createElement("li");
    summaryItem.className = "summary-item";

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
  paymentMethodBackButton.hidden = true;

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
  paymentMethodBackButton.hidden = false;

  for (const [methodName, panel] of Object.entries(paymentPanels)) {
    panel.hidden = methodName !== method;
  }

  const heading = paymentPanels[method].querySelector("h3");
  heading.focus();
}

function showPaymentSuccess() {
  orderSummary.hidden = true;
  paymentScreen.hidden = true;
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
  document.getElementById("receipt-status").textContent = "Payment Successful";
}

function completePayment(method, amountPaidInCents) {
  const totalInCents = getOrderTotalInCents();
  paymentRecord.method = method;
  paymentRecord.amountPaidInCents = amountPaidInCents;
  paymentRecord.changeInCents = Math.max(0, amountPaidInCents - totalInCents);
  paymentRecord.transactionReference = generateTransactionReference();
  paymentRecord.transactionDate = new Date().toLocaleString();
  paymentRecord.totalInCents = totalInCents;
  paymentRecord.items = Array.from(order.values(), (product) => ({ ...product }));
  showPaymentSuccess();
}

function showReceipt() {
  renderReceipt();
  paymentConfirmation.hidden = true;
  receiptScreen.hidden = false;
  document.getElementById("receipt-heading").focus();
}

function returnToPaymentSuccess() {
  receiptScreen.hidden = true;
  paymentConfirmation.hidden = false;
  document.getElementById("payment-success-heading").focus();
}

function startNewTransaction() {
  order.clear();
  Object.assign(paymentRecord, {
    method: "",
    amountPaidInCents: 0,
    changeInCents: 0,
    transactionReference: "",
    transactionDate: "",
    totalInCents: 0,
    items: []
  });

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
  document.getElementById("receipt-status").textContent = "";
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

renderOrder();