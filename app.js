// ========================================
// MAYA CLOTHING
// Supabase Connection
// ========================================

const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ========================================
// VARIABLES
// ========================================

let allProducts = [];
let cart = [];


// ========================================
// LOAD CATEGORIES
// ========================================

async function loadCategories() {

  const container =
    document.getElementById("categories");

  const { data, error } =
    await supabaseClient
      .from("categories")
      .select("*")
      .order("name");

  if (error) {

    console.error("Category Error:", error);

    container.innerHTML =
      "<p>Unable to load categories.</p>";

    return;
  }

  container.innerHTML =
    `<button onclick="loadProducts()">All</button>`;

  data.forEach(category => {

    const button =
      document.createElement("button");

    button.textContent =
      category.name;

    button.onclick = () =>
      filterCategory(category.id);

    container.appendChild(button);

  });

}


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

  const container =
    document.getElementById("products");

  container.innerHTML =
    `<div class="loading">
      Loading products...
    </div>`;

  const { data, error } =
    await supabaseClient
      .from("products")
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error("Product Error:", error);

    container.innerHTML =
      `<div class="loading">
        Failed to load products.
      </div>`;

    return;
  }

  allProducts = data || [];

  displayProducts(allProducts);

}


// ========================================
// DISPLAY PRODUCTS
// ========================================

function displayProducts(products) {

  const container =
    document.getElementById("products");

  if (!products.length) {

    container.innerHTML =
      `<div class="loading">
        No products found.
      </div>`;

    return;
  }

  container.innerHTML = "";

  products.forEach(product => {

    const card =
      document.createElement("div");

    card.className =
      "product-card";

    const finalPrice =
      product.discount_price ||
      product.price;

    const oldPrice =
      product.discount_price
        ? `<span class="old-price">
             ₦${formatMoney(product.price)}
           </span>`
        : "";

    const stockText =
      product.stock > 0
        ? `${product.stock} available`
        : "Out of stock";

    card.innerHTML = `

      <img
        class="product-image"
        src="${
          product.image_url ||
          "https://placehold.co/600x600?text=MAYA+CLOTHING"
        }"
        alt="${escapeHtml(product.name)}"
        onerror="
          this.src='https://placehold.co/600x600?text=MAYA+CLOTHING'
        "
      >

      <div class="product-info">

        <div class="product-name">
          ${escapeHtml(product.name)}
        </div>

        <div class="price">

          ₦${formatMoney(finalPrice)}

          ${oldPrice}

        </div>

        <div class="stock">
          ${stockText}
        </div>

        <button
          class="add-btn"
          ${
            product.stock <= 0
              ? "disabled"
              : ""
          }
          onclick="addToCart(${product.id})"
        >

          ${
            product.stock > 0
              ? "Add to Cart"
              : "Out of Stock"
          }

        </button>

      </div>

    `;

    container.appendChild(card);

  });

}


// ========================================
// CATEGORY FILTER
// ========================================

function filterCategory(categoryId) {

  const filtered =
    allProducts.filter(
      product =>
        product.category_id === categoryId
    );

  displayProducts(filtered);

  scrollToShop();

}


// ========================================
// SEARCH
// ========================================

function searchProducts() {

  const search =
    document
      .getElementById("search")
      .value
      .toLowerCase()
      .trim();

  if (!search) {

    displayProducts(allProducts);

    return;
  }

  const filtered =
    allProducts.filter(product =>

      product.name
        .toLowerCase()
        .includes(search)

      ||

      (product.description || "")
        .toLowerCase()
        .includes(search)

    );

  displayProducts(filtered);

}


// ========================================
// ADD TO CART
// ========================================

function addToCart(productId) {

  const product =
    allProducts.find(
      item => item.id === productId
    );

  if (!product) return;

  const existing =
    cart.find(
      item => item.id === productId
    );

  if (existing) {

    if (
      existing.quantity <
      product.stock
    ) {

      existing.quantity++;

    }

  } else {

    cart.push({
      ...product,
      quantity: 1
    });

  }

  updateCart();

}


// ========================================
// UPDATE CART
// ========================================

function updateCart() {

  const count =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  document.getElementById(
    "cartCount"
  ).textContent = count;

  renderCart();

}


// ========================================
// RENDER CART
// ========================================

function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );

  if (!cart.length) {

    container.innerHTML =
      "<p>Your cart is empty.</p>";

    document.getElementById(
      "cartTotal"
    ).textContent = "₦0";

    return;
  }

  container.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    const price =
      item.discount_price ||
      item.price;

    total +=
      price * item.quantity;

    const div =
      document.createElement("div");

    div.className =
      "cart-item";

    div.innerHTML = `

      <div>

        <strong>
          ${escapeHtml(item.name)}
        </strong>

        <br>

        ${item.quantity}
        ×
        ₦${formatMoney(price)}

      </div>

      <button
        onclick="
          removeFromCart(${item.id})
        "
      >
        ✕
      </button>

    `;

    container.appendChild(div);

  });

  document.getElementById(
    "cartTotal"
  ).textContent =
    "₦" + formatMoney(total);

}


// ========================================
// REMOVE FROM CART
// ========================================

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        item.id !== productId
    );

  updateCart();

}


// ========================================
// CART MODAL
// ========================================

function openCart() {

  document.getElementById(
    "cartModal"
  ).style.display =
    "block";

}


function closeCart() {

  document.getElementById(
    "cartModal"
  ).style.display =
    "none";

}


// ========================================
// HELPERS
// ========================================

function formatMoney(value) {

  return Number(value)
    .toLocaleString("en-NG");

}


function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text || "";

  return div.innerHTML;

}


function scrollToShop() {

  document
    .getElementById("shop")
    .scrollIntoView({
      behavior: "smooth"
    });

}


// ========================================
// START
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadCategories();

    loadProducts();

  }
);
