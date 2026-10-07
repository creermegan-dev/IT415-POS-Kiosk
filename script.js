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

const order = new Map();

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
  orderSummary.hidden = false;
  document.getElementById("summary-heading").focus();
}

function returnToItemSelection() {
  orderSummary.hidden = true;
  productSelection.hidden = false;
  orderCart.hidden = false;
  document.querySelector(".product-card").focus();
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
document.getElementById("continue-payment-button").addEventListener("click", () => {
  if (order.size === 0) {
    summaryFeedback.textContent = "Please add at least one item before continuing.";
    return;
  }

  summaryFeedback.textContent = "Payment processing is not available yet.";
});

renderOrder();