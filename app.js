// ==========================================
// MAYA CLOTHING
// CUSTOMER APP
// ==========================================

const SUPABASE_URL = "https://shvugtyxmcwsvlpnadjp.supabase.co";
const SUPABASE_KEY = "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let allProducts = [];
let cart = [];

// ==========================================
// PAGE START
// ==========================================

document.addEventListener("DOMContentLoaded", async function () {
  console.log("MAYA CLOTHING APP STARTED");

  loadCart();
  updateCart();

  await loadCategories();
  await loadProducts();
});

// ==========================================
// LOAD CATEGORIES
// ==========================================

async function loadCategories() {
  const box = document.getElementById("categories");

  if (!box) return;

  try {
    const result = await supabaseClient
      .from("categories")
      .select("id, name, slug")
      .order("id", { ascending: true });

    if (result.error) {
      console.error("Categories error:", result.error);
      return;
    }

    const data = result.data || [];

    box.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.textContent = "All";
    allButton.onclick = function () {
      displayProducts(allProducts);
    };

    box.appendChild(allButton);

    data.forEach(function (category) {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = category.name;

      button.onclick = function () {
        filterCategory(category.id);
      };

      box.appendChild(button);
    });

  } catch (error) {
    console.error("Category error:", error);
  }
}

// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {
  const box = document.getElementById("products");

  if (!box) return;

  box.innerHTML = `
    <div style="padding:30px;text-align:center;">
      <h3>Loading products...</h3>
    </div>
  `;

  try {
    const result = await supabaseClient
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
        is_active,
        created_at
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    console.log("PRODUCT DATA:", result.data);
    console.log("PRODUCT ERROR:", result.error);

    if (result.error) {
      console.error("Products error:", result.error);

      box.innerHTML = `
        <div style="padding:30px;text-align:center;">
          <h3>Unable to load products</h3>
          <p>${escapeHtml(result.error.message)}</p>
        </div>
      `;

      return;
    }

    allProducts = result.data || [];

    displayProducts(allProducts);

  } catch (error) {
    console.error("Products error:", error);

    box.innerHTML = `
      <div style="padding:30px;text-align:center;">
        <h3>Something went wrong</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {
  const box = document.getElementById("products");

  if (!box) return;

  if (!products || products.length === 0) {
    box.innerHTML = `
      <div style="padding:30px;text-align:center;">
        <h3>No products available</h3>
        <p>Please check again later.</p>
      </div>
    `;

    return;
  }

  box.innerHTML = products.map(function (product) {

    const price = Number(product.price) || 0;

    const discount =
      product.discount_price !== null &&
      product.discount_price !== undefined &&
      Number(product.discount_price) > 0
        ? Number(product.discount_price)
        : null;

    const finalPrice =
      discount !== null ? discount : price;

    const image =
      product.image_url ||
      "https://via.placeholder.com/500x500?text=MAYA+CLOTHING";

    const stock = Number(product.stock) || 0;

    return `
      <div class="product-card">

        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          class="product-image"
          onerror="this.src='https://via.placeholder.com/500x500?text=MAYA+CLOTHING'"
        >

        <div class="product-info">

          <h3>${escapeHtml(product.name)}</h3>

          <div class="product-price">
            <strong>${formatMoney(finalPrice)}</strong>

            ${
              discount !== null
                ? `<del>${formatMoney(price)}</del>`
                : ""
            }
          </div>

          ${
            stock > 0
              ? `<p class="stock">In Stock: ${stock}</p>`
              : `<p class="stock">Out of Stock</p>`
          }

          ${
            stock > 0
              ? `
                <button
                  type="button"
                  onclick="addToCart(${Number(product.id)})"
                >
                  🛒 Add to Cart
                </button>
              `
              : `
                <button type="button" disabled>
                  Out of Stock
                </button>
              `
          }

        </div>

      </div>
    `;

  }).join("");
}

// ==========================================
// FILTER CATEGORY
// ==========================================

async function filterCategory(categoryId) {
  const box = document.getElementById("products");

  if (!box) return;

  box.innerHTML = `
    <div style="padding:30px;text-align:center;">
      <h3>Loading products...</h3>
    </div>
  `;

  try {
    const result = await supabaseClient
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
        is_active,
        created_at
      `)
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (result.error) {
      console.error("Filter error:", result.error);

      box.innerHTML = `
        <div style="padding:30px;text-align:center;">
          <h3>Unable to load products</h3>
          <p>${escapeHtml(result.error.message)}</p>
        </div>
      `;

      return;
    }

    displayProducts(result.data || []);

  } catch (error) {

    console.error("Filter error:", error);

    box.innerHTML = `
      <div style="padding:30px;text-align:center;">
        <h3>Something went wrong</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

// ==========================================
// SEARCH
// ==========================================

function searchProducts() {
  const input = document.getElementById("search");

  if (!input) return;

  const text = input.value.trim().toLowerCase();

  if (!text) {
    displayProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter(function (product) {

    const name =
      String(product.name || "").toLowerCase();

    const description =
      String(product.description || "").toLowerCase();

    return (
      name.includes(text) ||
      description.includes(text)
    );
  });

  displayProducts(filtered);
}

// ==========================================
// ADD TO CART
// ==========================================

function addToCart(productId) {

  const product = allProducts.find(function (item) {
    return Number(item.id) === Number(productId);
  });

  if (!product) {
    alert("Product not found.");
    return;
  }

  const stock = Number(product.stock) || 0;

  if (stock <= 0) {
    alert("This product is out of stock.");
    return;
  }

  const existing = cart.find(function (item) {
    return Number(item.id) === Number(productId);
  });

  if (existing) {

    if (existing.quantity >= stock) {
      alert("You cannot add more than available stock.");
      return;
    }

    existing.quantity++;

  } else {

    const price =
      product.discount_price !== null &&
      product.discount_price !== undefined &&
      Number(product.discount_price) > 0
        ? Number(product.discount_price)
        : Number(product.price) || 0;

    cart.push({
      id: Number(product.id),
      name: product.name,
      price: price,
      image_url: product.image_url || "",
      stock: stock,
      quantity: 1
    });
  }

  saveCart();
  updateCart();

  alert("Product added to cart.");
}

// ==========================================
// LOAD CART
// ==========================================

function loadCart() {

  try {

    const saved =
      localStorage.getItem("maya_cart");

    cart = saved
      ? JSON.parse(saved)
      : [];

    if (!Array.isArray(cart)) {
      cart = [];
    }

  } catch (error) {

    console.error("Cart error:", error);

    cart = [];
  }
}

// ==========================================
// SAVE CART
// ==========================================

function saveCart() {

  localStorage.setItem(
    "maya_cart",
    JSON.stringify(cart)
  );
}

// ==========================================
// UPDATE CART COUNT
// ==========================================

function updateCart() {

  const count =
    document.getElementById("cartCount");

  if (!count) return;

  const total = cart.reduce(function (sum, item) {

    return (
      sum +
      Number(item.quantity || 0)
    );

  }, 0);

  count.textContent = total;
}

// ==========================================
// OPEN CART
// ==========================================

function openCart() {

  renderCart();

  const modal =
    document.getElementById("cartModal");

  if (modal) {
    modal.classList.add("show");
  }
}

// ==========================================
// CLOSE CART
// ==========================================

function closeCart() {

  const modal =
    document.getElementById("cartModal");

  if (modal) {
    modal.classList.remove("show");
  }
}

// ==========================================
// RENDER CART
// ==========================================

function renderCart() {

  const itemsBox =
    document.getElementById("cartItems");

  const totalBox =
    document.getElementById("cartTotal");

  if (!itemsBox || !totalBox) return;

  if (cart.length === 0) {

    itemsBox.innerHTML = `
      <p>Your cart is empty.</p>
    `;

    totalBox.textContent = "₦0";

    return;
  }

  itemsBox.innerHTML = cart.map(function (item) {

    const subtotal =
      Number(item.price) *
      Number(item.quantity);

    const image =
      item.image_url ||
      "https://via.placeholder.com/100";

    return `
      <div class="cart-item">

        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(item.name)}"
          width="80"
          height="80"
          onerror="this.src='https://via.placeholder.com/100'"
        >

        <div>

          <h4>
            ${escapeHtml(item.name)}
          </h4>

          <p>
            ${formatMoney(item.price)}
          </p>

          <div>

            <button
              type="button"
              onclick="changeQuantity(${Number(item.id)}, -1)"
            >
              −
            </button>

            <span>
              ${Number(item.quantity)}
            </span>

            <button
              type="button"
              onclick="changeQuantity(${Number(item.id)}, 1)"
            >
              +
            </button>

          </div>

          <strong>
            ${formatMoney(subtotal)}
          </strong>

          <button
            type="button"
            onclick="removeFromCart(${Number(item.id)})"
          >
            Remove
          </button>

        </div>

      </div>
    `;

  }).join("");

  const total = cart.reduce(function (sum, item) {

    return (
      sum +
      Number(item.price) *
      Number(item.quantity)
    );

  }, 0);

  totalBox.textContent =
    formatMoney(total);
}

// ==========================================
// CHANGE QUANTITY
// ==========================================

function changeQuantity(productId, change) {

  const item = cart.find(function (item) {

    return (
      Number(item.id) ===
      Number(productId)
    );

  });

  if (!item) return;

  const quantity =
    Number(item.quantity) +
    Number(change);

  if (quantity <= 0) {

    removeFromCart(productId);

    return;
  }

  if (quantity > Number(item.stock)) {

    alert("Not enough stock available.");

    return;
  }

  item.quantity = quantity;

  saveCart();
  updateCart();
  renderCart();
}

// ==========================================
// REMOVE FROM CART
// ==========================================

function removeFromCart(productId) {

  cart = cart.filter(function (item) {

    return (
      Number(item.id) !==
      Number(productId)
    );

  });

  saveCart();
  updateCart();
  renderCart();
}

// ==========================================
// OPEN CHECKOUT
// ==========================================

function openCheckout() {

  if (cart.length === 0) {

    alert("Your cart is empty.");

    return;
  }

  const total = cart.reduce(function (sum, item) {

    return (
      sum +
      Number(item.price) *
      Number(item.quantity)
    );

  }, 0);

  const totalBox =
    document.getElementById("checkoutTotal");

  if (totalBox) {
    totalBox.textContent =
      formatMoney(total);
  }

  closeCart();

  const modal =
    document.getElementById("checkoutModal");

  if (modal) {
    modal.classList.add("show");
  }
}

// ==========================================
// CLOSE CHECKOUT
// ==========================================

function closeCheckout() {

  const modal =
    document.getElementById("checkoutModal");

  if (modal) {
    modal.classList.remove("show");
  }
}

// ==========================================
// SUBMIT ORDER
// ==========================================

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

  if (!button || !message) return;

  button.disabled = true;
  button.textContent = "Processing...";

  message.textContent = "";

  try {

    const customerName =
      document
        .getElementById("customerName")
        .value
        .trim();

    const phone =
      document
        .getElementById("customerPhone")
        .value
        .trim();

    const whatsapp =
      document
        .getElementById("customerWhatsapp")
        .value
        .trim();

    const email =
      document
        .getElementById("customerEmail")
        .value
        .trim();

    const address =
      document
        .getElementById("customerAddress")
        .value
        .trim();

    const city =
      document
        .getElementById("customerCity")
        .value
        .trim();

    const state =
      document
        .getElementById("customerState")
        .value
        .trim();

    const notes =
      document
        .getElementById("orderNotes")
        .value
        .trim();

    const items = cart.map(function (item) {

      return {
        product_id: Number(item.id),
        quantity: Number(item.quantity)
      };

    });

    const result =
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

    if (result.error) {

      console.error(
        "Order error:",
        result.error
      );

      message.innerHTML = `
        <div style="color:red;">
          ${escapeHtml(result.error.message)}
        </div>
      `;

      button.disabled = false;
      button.textContent = "Place Order";

      return;
    }

    console.log(
      "Order created:",
      result.data
    );

    const orderId =
      result.data?.order_id ||
      result.data?.id ||
      "";

    message.innerHTML = `
      <div style="color:green;">
        <strong>
          Order placed successfully! ✅
        </strong>

        ${
          orderId
            ? `<p>Order ID: ${escapeHtml(orderId)}</p>`
            : ""
        }
      </div>
    `;

    cart = [];

    saveCart();
    updateCart();

    const form =
      document.getElementById("checkoutForm");

    if (form) {
      form.reset();
    }

    button.textContent =
      "Order Successful";

  } catch (error) {

    console.error(
      "Order submit error:",
      error
    );

    message.innerHTML = `
      <div style="color:red;">
        ${escapeHtml(
          error.message ||
          "Unable to place order."
        )}
      </div>
    `;

    button.disabled = false;
    button.textContent =
      "Place Order";
  }
}

// ==========================================
// SCROLL TO SHOP
// ==========================================

function scrollToShop() {

  const shop =
    document.getElementById("shop");

  if (shop) {

    shop.scrollIntoView({
      behavior: "smooth"
    });

  }
}

// ==========================================
// FORMAT MONEY
// ==========================================

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

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

function escapeAttribute(value) {

  return escapeHtml(value);
}

// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

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
