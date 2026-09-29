const SUPABASE_URL = "https://shvugtyxmcwsvlpnadjp.supabase.co";
const SUPABASE_KEY = "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allProducts = [];
let cart = [];

// ================================
// LOAD CATEGORIES
// ================================
async function loadCategories() {
  const categoriesBox = document.getElementById("categories");

  try {
    const { data, error } = await supabaseClient
      .from("categories")
      .select("id, name, slug")
      .order("id", { ascending: true });

    if (error) {
      console.error("Categories error:", error);
      return;
    }

    categoriesBox.innerHTML = `
      <button onclick="loadProducts()" class="active">
        All
      </button>
    `;

    data.forEach(category => {
      const button = document.createElement("button");

      button.textContent = category.name;

      button.onclick = () => {
        filterCategory(category.id);
      };

      categoriesBox.appendChild(button);
    });

  } catch (error) {
    console.error("Category loading error:", error);
  }
}

// ================================
// LOAD PRODUCTS
// ================================
async function loadProducts() {
  const productsBox = document.getElementById("products");

  productsBox.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        discount_price,
        category_id,
        sizes,
        colors,
        stock,
        image_url,
        is_active
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    console.log("Products:", data);
    console.log("Products error:", error);

    if (error) {
      productsBox.innerHTML = `
        <div style="padding:25px;text-align:center;">
          <h3>Unable to load products</h3>
          <p>${error.message}</p>
        </div>
      `;

      return;
    }

    allProducts = data || [];

    displayProducts(allProducts);

  } catch (error) {
    console.error("Product loading error:", error);

    productsBox.innerHTML = `
      <div style="padding:25px;text-align:center;">
        <h3>Something went wrong</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// ================================
// DISPLAY PRODUCTS
// ================================
function displayProducts(products) {
  const productsBox = document.getElementById("products");

  if (!products || products.length === 0) {
    productsBox.innerHTML = `
      <div style="padding:30px;text-align:center;">
        <h3>No products available</h3>
        <p>Please check again later.</p>
      </div>
    `;

    return;
  }

  productsBox.innerHTML = products.map(product => {

    const hasDiscount =
      product.discount_price !== null &&
      Number(product.discount_price) > 0;

    const finalPrice = hasDiscount
      ? Number(product.discount_price)
      : Number(product.price);

    const oldPrice = hasDiscount
      ? Number(product.price)
      : null;

    const image = product.image_url
      ? product.image_url
      : "https://via.placeholder.com/500x500?text=MAYA+CLOTHING";

    return `
      <div class="product-card">

        <div class="product-image">
          <img
            src="${image}"
            alt="${escapeHtml(product.name)}"
            loading="lazy"
          >
        </div>

        <div class="product-info">

          <h3>${escapeHtml(product.name)}</h3>

          <div class="price">

            <strong>
              ${formatMoney(finalPrice)}
            </strong>

            ${
              oldPrice
                ? `<span class="old-price">
                    ${formatMoney(oldPrice)}
                   </span>`
                : ""
            }

          </div>

          ${
            product.stock > 0
              ? `<p class="stock">In Stock: ${product.stock}</p>`
              : `<p class="stock">Out of Stock</p>`
          }

          <button
            class="add-cart-btn"
            onclick="addToCart(${product.id})"
            ${product.stock <= 0 ? "disabled" : ""}
          >
            ${
              product.stock > 0
                ? "🛒 Add to Cart"
                : "Out of Stock"
            }
          </button>

        </div>

      </div>
    `;
  }).join("");
}

// ================================
// FILTER CATEGORY
// ================================
async function filterCategory(categoryId) {

  const productsBox = document.getElementById("products");

  productsBox.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;

  try {

    const { data, error } = await supabaseClient
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        discount_price,
        category_id,
        sizes,
        colors,
        stock,
        image_url,
        is_active
      `)
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Category products error:", error);

      productsBox.innerHTML = `
        <div style="padding:25px;text-align:center;">
          <p>${error.message}</p>
        </div>
      `;

      return;
    }

    displayProducts(data || []);

  } catch (error) {
    console.error(error);
  }
}

// ================================
// SEARCH
// ================================
function searchProducts() {

  const searchInput = document.getElementById("search");

  const searchText =
    searchInput.value.trim().toLowerCase();

  if (!searchText) {
    displayProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter(product => {

    const name =
      (product.name || "").toLowerCase();

    const description =
      (product.description || "").toLowerCase();

    return (
      name.includes(searchText) ||
      description.includes(searchText)
    );
  });

  displayProducts(filtered);
}

// ================================
// CART
// ================================
function addToCart(productId) {

  const product = allProducts.find(
    item => Number(item.id) === Number(productId)
  );

  if (!product) {
    alert("Product not found.");
    return;
  }

  if (product.stock <= 0) {
    alert("This product is out of stock.");
    return;
  }

  const existing = cart.find(
    item => Number(item.id) === Number(productId)
  );

  if (existing) {

    if (existing.quantity >= product.stock) {
      alert("You cannot add more than available stock.");
      return;
    }

    existing.quantity++;

  } else {

    cart.push({
      id: product.id,
      name: product.name,
      price:
        product.discount_price !== null &&
        Number(product.discount_price) > 0
          ? Number(product.discount_price)
          : Number(product.price),
      image_url: product.image_url,
      stock: product.stock,
      quantity: 1
    });

  }

  saveCart();
  updateCart();

  alert("Product added to cart.");
}

// ================================
// SAVE CART
// ================================
function saveCart() {
  localStorage.setItem(
    "maya_cart",
    JSON.stringify(cart)
  );
}

// ================================
// LOAD CART
// ================================
function loadCart() {

  try {

    const saved =
      localStorage.getItem("maya_cart");

    cart = saved
      ? JSON.parse(saved)
      : [];

  } catch (error) {

    cart = [];

  }
}

// ================================
// UPDATE CART
// ================================
function updateCart() {

  const countBox =
    document.getElementById("cartCount");

  const count = cart.reduce(
    (total, item) =>
      total + Number(item.quantity),
    0
  );

  countBox.textContent = count;
}

// ================================
// OPEN CART
// ================================
function openCart() {

  renderCart();

  document.getElementById("cartModal")
    .classList.add("show");
}

// ================================
// CLOSE CART
// ================================
function closeCart() {

  document.getElementById("cartModal")
    .classList.remove("show");
}

// ================================
// RENDER CART
// ================================
function renderCart() {

  const cartItems =
    document.getElementById("cartItems");

  const cartTotal =
    document.getElementById("cartTotal");

  if (cart.length === 0) {

    cartItems.innerHTML = `
      <div style="padding:25px;text-align:center;">
        <p>Your cart is empty.</p>
      </div>
    `;

    cartTotal.textContent = "₦0";

    return;
  }

  cartItems.innerHTML =
    cart.map(item => {

      const subtotal =
        Number(item.price) *
        Number(item.quantity);

      return `
        <div class="cart-item">

          <img
            src="${
              item.image_url ||
              "https://via.placeholder.com/100"
            }"
            alt="${escapeHtml(item.name)}"
          >

          <div class="cart-item-info">

            <h4>${escapeHtml(item.name)}</h4>

            <p>
              ${formatMoney(item.price)}
            </p>

            <div class="quantity-controls">

              <button
                onclick="changeQuantity(${item.id}, -1)"
              >
                −
              </button>

              <span>${item.quantity}</span>

              <button
                onclick="changeQuantity(${item.id}, 1)"
              >
                +
              </button>

            </div>

            <strong>
              ${formatMoney(subtotal)}
            </strong>

            <button
              onclick="removeFromCart(${item.id})"
              class="remove-btn"
            >
              Remove
            </button>

          </div>

        </div>
      `;

    }).join("");

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
        Number(item.quantity),
      0
    );

  cartTotal.textContent =
    formatMoney(total);
}

// ================================
// CHANGE QUANTITY
// ================================
function changeQuantity(productId, change) {

  const item = cart.find(
    item => Number(item.id) === Number(productId)
  );

  if (!item) return;

  const newQuantity =
    Number(item.quantity) +
    Number(change);

  if (newQuantity <= 0) {

    removeFromCart(productId);
    return;

  }

  if (newQuantity > item.stock) {

    alert("Not enough stock available.");
    return;

  }

  item.quantity = newQuantity;

  saveCart();
  updateCart();
  renderCart();
}

// ================================
// REMOVE FROM CART
// ================================
function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        Number(item.id) !==
        Number(productId)
    );

  saveCart();
  updateCart();
  renderCart();
}

// ================================
// CHECKOUT
// ================================
function openCheckout() {

  if (cart.length === 0) {

    alert("Your cart is empty.");
    return;

  }

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
        Number(item.quantity),
      0
    );

  document.getElementById("checkoutTotal")
    .textContent =
    formatMoney(total);

  document.getElementById("checkoutModal")
    .classList.add("show");
}

// ================================
// CLOSE CHECKOUT
// ================================
function closeCheckout() {

  document.getElementById("checkoutModal")
    .classList.remove("show");
}

// ================================
// SUBMIT ORDER
// ================================
async function submitOrder(event) {

  event.preventDefault();

  if (cart.length === 0) {

    alert("Your cart is empty.");
    return;

  }

  const button =
    document.getElementById("placeOrderBtn");

  const message =
    document.getElementById("checkoutMessage");

  button.disabled = true;
  button.textContent = "Processing...";

  message.textContent = "";

  try {

    const customerName =
      document.getElementById("customerName").value.trim();

    const phone =
      document.getElementById("customerPhone").value.trim();

    const whatsapp =
      document.getElementById("customerWhatsapp").value.trim();

    const email =
      document.getElementById("customerEmail").value.trim();

    const address =
      document.getElementById("customerAddress").value.trim();

    const city =
      document.getElementById("customerCity").value.trim();

    const state =
      document.getElementById("customerState").value.trim();

    const notes =
      document.getElementById("orderNotes").value.trim();

    const items = cart.map(item => ({
      product_id: Number(item.id),
      quantity: Number(item.quantity)
    }));

    const { data, error } =
      await supabaseClient.rpc(
        "create_order",
        {
          p_customer_name: customerName,
          p_phone: phone,
          p_whatsapp: whatsapp || null,
          p_email: email || null,
          p_address: address,
          p_city: city || null,
          p_state: state || null,
          p_notes: notes || null,
          p_items: items
        }
      );

    if (error) {

      console.error(
        "Order error:",
        error
      );

      message.textContent =
        error.message;

      button.disabled = false;
      button.textContent =
        "Place Order";

      return;
    }

    console.log(
      "Order created:",
      data
    );

    const orderId =
      data?.order_id ||
      data?.id ||
      "";

    message.innerHTML = `
      <strong style="color:green;">
        Order placed successfully! ✅
      </strong>
      ${
        orderId
          ? `<br>Order ID: ${orderId}`
          : ""
      }
    `;

    cart = [];

    saveCart();
    updateCart();

    document.getElementById("checkoutForm")
      .reset();

    button.textContent =
      "Order Successful";

  } catch (error) {

    console.error(error);

    message.textContent =
      error.message ||
      "Unable to place order.";

    button.disabled = false;
    button.textContent =
      "Place Order";
  }
}

// ================================
// SCROLL TO SHOP
// ================================
function scrollToShop() {

  document.getElementById("shop")
    .scrollIntoView({
      behavior: "smooth"
    });
}

// ================================
// FORMAT MONEY
// ================================
function formatMoney(amount) {

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }
  ).format(Number(amount) || 0);
}

// ================================
// ESCAPE HTML
// ================================
function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ================================
// START APP
// ================================
document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "MAYA CLOTHING APP STARTED"
    );

    loadCart();
    updateCart();

    await loadCategories();
    await loadProducts();

  }
);

// Make functions available to HTML onclick
window.loadProducts = loadProducts;
window.filterCategory = filterCategory;
window.searchProducts = searchProducts;
window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.submitOrder = submitOrder;
window.scrollToShop = scrollToShop;
