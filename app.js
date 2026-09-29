// ========================================
// MAYA CLOTHING - APP.JS
// ========================================

const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allProducts = [];
let cart = [];


// ========================================
// LOAD CATEGORIES
// ========================================

async function loadCategories() {

  const container = document.getElementById("categories");

  if (!container) return;

  const { data, error } = await supabaseClient
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
    `<button type="button" onclick="loadProducts()">All</button>`;

  (data || []).forEach(category => {

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = category.name;

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

  if (!container) return;

  container.innerHTML =
    `<div class="loading">Loading products...</div>`;

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

  if (!container) return;

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

    card.className = "product-card";

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
          type="button"
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

  const input =
    document.getElementById("search");

  if (!input) return;

  const search =
    input.value
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

  if (!product) {

    alert("Product not found.");

    return;
  }

  const existing =
    cart.find(
      item => item.id === productId
    );

  if (existing) {

    if (existing.quantity < product.stock) {

      existing.quantity++;

    } else {

      alert("Maximum available stock reached.");

      return;
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

  const cartCount =
    document.getElementById("cartCount");

  if (cartCount) {

    cartCount.textContent = count;

  }

  renderCart();
}


// ========================================
// RENDER CART
// ========================================

function renderCart() {

  const container =
    document.getElementById("cartItems");

  if (!container) return;

  if (!cart.length) {

    container.innerHTML =
      "<p>Your cart is empty.</p>";

    const totalElement =
      document.getElementById("cartTotal");

    if (totalElement) {

      totalElement.textContent = "₦0";

    }

    return;
  }

  container.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    const price =
      item.discount_price ||
      item.price;

    total +=
      Number(price) *
      Number(item.quantity);

    const div =
      document.createElement("div");

    div.className = "cart-item";

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
        type="button"
        onclick="removeFromCart(${item.id})"
      >
        ✕
      </button>

    `;

    container.appendChild(div);

  });

  const totalElement =
    document.getElementById("cartTotal");

  if (totalElement) {

    totalElement.textContent =
      "₦" + formatMoney(total);

  }
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
// OPEN CART
// ========================================

function openCart() {

  const modal =
    document.getElementById("cartModal");

  if (!modal) return;

  modal.style.display = "block";
}


// ========================================
// CLOSE CART
// ========================================

function closeCart() {

  const modal =
    document.getElementById("cartModal");

  if (!modal) return;

  modal.style.display = "none";
}


// ========================================
// OPEN CHECKOUT
// ========================================

function openCheckout() {

  console.log("OPEN CHECKOUT");

  if (!cart.length) {

    alert("Your cart is empty.");

    return;
  }

  let total = 0;

  cart.forEach(item => {

    const price =
      item.discount_price ||
      item.price;

    total +=
      Number(price) *
      Number(item.quantity);

  });

  const checkoutTotal =
    document.getElementById("checkoutTotal");

  if (checkoutTotal) {

    checkoutTotal.textContent =
      "₦" + formatMoney(total);

  }

  const message =
    document.getElementById("checkoutMessage");

  if (message) {

    message.textContent = "";

  }

  const cartModal =
    document.getElementById("cartModal");

  if (cartModal) {

    cartModal.style.display = "none";

  }

  const checkoutModal =
    document.getElementById("checkoutModal");

  if (checkoutModal) {

    checkoutModal.style.display = "block";

  } else {

    alert("Checkout section not found.");

  }
}


// ========================================
// CLOSE CHECKOUT
// ========================================

function closeCheckout() {

  const modal =
    document.getElementById("checkoutModal");

  if (!modal) return;

  modal.style.display = "none";
}


// ========================================
// SUBMIT ORDER
// ========================================

async function submitOrder(event) {

  event.preventDefault();

  if (!cart.length) {

    alert("Your cart is empty.");

    return;
  }

  const button =
    document.getElementById("placeOrderBtn");

  const message =
    document.getElementById("checkoutMessage");

  if (button) {

    button.disabled = true;
    button.textContent = "Processing...";

  }

  if (message) {

    message.textContent = "";
    message.style.color = "";

  }

  try {

    const customerName =
      document
        .getElementById("customerName")
        .value
        .trim();

    const customerPhone =
      document
        .getElementById("customerPhone")
        .value
        .trim();

    const customerWhatsapp =
      document
        .getElementById("customerWhatsapp")
        .value
        .trim();

    const customerEmail =
      document
        .getElementById("customerEmail")
        .value
        .trim();

    const customerAddress =
      document
        .getElementById("customerAddress")
        .value
        .trim();

    const customerCity =
      document
        .getElementById("customerCity")
        .value
        .trim();

    const customerState =
      document
        .getElementById("customerState")
        .value
        .trim();

    const orderNotes =
      document
        .getElementById("orderNotes")
        .value
        .trim();


    // Prepare order items
    const items =
      cart.map(item => ({

        product_id: item.id,

        quantity: item.quantity

      }));


    // Create order in Supabase
    const { data, error } =
      await supabaseClient.rpc(
        "create_order",
        {
          p_customer_name: customerName,
          p_phone: customerPhone,
          p_whatsapp:
            customerWhatsapp || null,
          p_email:
            customerEmail || null,
          p_address: customerAddress,
          p_city:
            customerCity || null,
          p_state:
            customerState || null,
          p_notes:
            orderNotes || null,
          p_items: items
        }
      );


    if (error) {

      console.error(
        "Supabase Order Error:",
        error
      );

      throw new Error(
        error.message
      );

    }


    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        data?.message ||
        "Order was not completed."
      );

    }


    // Success
    const orderId =
      data.order_id;

    const totalAmount =
      data.total_amount;


    // Empty cart
    cart = [];

    updateCart();


    // Reset form
    const form =
      document.getElementById(
        "checkoutForm"
      );

    if (form) {

      form.reset();

    }


    if (message) {

      message.innerHTML = `
        <strong>
          Order placed successfully!
        </strong>
        <br>
        Order ID:
        <strong>#${orderId}</strong>
        <br>
        Total:
        <strong>
          ₦${formatMoney(totalAmount)}
        </strong>
      `;

      message.style.color = "green";

    }


    if (button) {

      button.disabled = true;
      button.textContent = "Order Placed ✓";

    }


  } catch (error) {

    console.error(
      "Submit Order Error:",
      error
    );

    if (message) {

      message.textContent =
        error.message ||
        "Unable to place order.";

      message.style.color = "red";

    }

    if (button) {

      button.disabled = false;
      button.textContent = "Place Order";

    }

  }
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

  const shop =
    document.getElementById("shop");

  if (!shop) return;

  shop.scrollIntoView({
    behavior: "smooth"
  });
}


// ========================================
// START WEBSITE
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    console.log("MAYA APP.JS NEW VERSION LOADED");

    loadCategories();

    loadProducts();

    updateCart();

  }
);
