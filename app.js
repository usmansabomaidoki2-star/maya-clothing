// ==========================================
// MAYA CLOTHING
// CUSTOMER APP
// SUPABASE + PAYSTACK CHECKOUT
// PAYMENT VERIFICATION
// ==========================================


// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==========================================
// EDGE FUNCTION NAMES
// ==========================================

const INITIALIZE_FUNCTION =
  "initialize-paystack-payment-";

const VERIFY_FUNCTION =
  "verify-paystack-payment";


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let allProducts = [];
let cart = [];
let paymentVerificationRunning = false;


// ==========================================
// PAGE START
// ==========================================

document.addEventListener("DOMContentLoaded", async function () {

  console.log("MAYA CLOTHING APP STARTED");

  loadCart();
  updateCart();

  await handlePaystackReturn();

  await loadCategories();
  await loadProducts();

});


// ==========================================
// HANDLE PAYSTACK RETURN
// ==========================================

async function handlePaystackReturn() {

  if (paymentVerificationRunning) return;

  const url = new URL(window.location.href);

  const reference =
    url.searchParams.get("reference") ||
    url.searchParams.get("trxref");

  if (!reference) return;

  paymentVerificationRunning = true;

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div id="paymentCheckingNotice"
      style="
        position:fixed;
        inset:0;
        z-index:99999;
        background:rgba(0,0,0,.85);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        color:white;
        text-align:center;
        font-family:Arial,sans-serif;
      ">
      <div>
        <h2>Verifying Payment...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>
    </div>
    `
  );

  try {

    const result = await verifyPaystackPayment(reference);

    const notice = document.getElementById(
      "paymentCheckingNotice"
    );

    if (notice) notice.remove();

    if (result.success) {

      cart = [];

      saveCart();
      updateCart();
      renderCart();

      url.searchParams.delete("reference");
      url.searchParams.delete("trxref");

      window.history.replaceState(
        {},
        document.title,
        url.pathname + url.search + url.hash
      );

      alert(
        "Payment Successful! ✅\n\n" +
        "Your MAYA CLOTHING order has been confirmed.\n" +
        "Order ID: " + result.order_id
      );

    } else {

      alert(
        "Payment verification failed.\n\n" +
        (result.message || "Please contact MAYA CLOTHING.")
      );

    }

  } catch (error) {

    console.error("Payment return error:", error);

    const notice = document.getElementById(
      "paymentCheckingNotice"
    );

    if (notice) notice.remove();

    alert(
      "We could not verify your payment right now.\n\n" +
      "Please contact MAYA CLOTHING with your reference:\n" +
      reference
    );

  } finally {

    paymentVerificationRunning = false;

  }

}


// ==========================================
// VERIFY PAYSTACK PAYMENT
// ==========================================

async function verifyPaystackPayment(reference) {

  const { data, error } =
    await supabaseClient.functions.invoke(
      VERIFY_FUNCTION,
      {
        body: {
          reference: reference
        }
      }
    );

  if (error) {

    console.error("Verification error:", error);

    throw new Error(
      error.message || "Payment verification request failed."
    );

  }

  if (!data || data.success !== true) {

    return {
      success: false,
      message:
        data?.message ||
        data?.error ||
        "Payment has not been verified."
    };

  }

  return {
    success: true,
    message: data.message,
    order_id: data.order_id,
    payment_status: data.payment_status
  };

}


// ==========================================
// LOAD CATEGORIES
// ==========================================

async function loadCategories() {

  const box = document.getElementById("categories");

  if (!box) return;

  try {

    const { data, error } = await supabaseClient
      .from("categories")
      .select("id, name, slug")
      .order("id", { ascending: true });

    if (error) throw error;

    box.innerHTML = "";

    const allButton = document.createElement("button");

    allButton.type = "button";
    allButton.textContent = "All";
    allButton.classList.add("active");

    allButton.onclick = function () {
      loadProducts();
    };

    box.appendChild(allButton);

    (data || []).forEach(function (category) {

      const button = document.createElement("button");

      button.type = "button";
      button.textContent = category.name;

      button.onclick = function () {
        filterCategory(category.id);
      };

      box.appendChild(button);

    });

  } catch (error) {

    console.error("Categories error:", error);

    box.innerHTML = `
      <button type="button" onclick="loadProducts()">All</button>
    `;

  }

}


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

  const box = document.getElementById("products");

  if (!box) return;

  box.innerHTML = `
    <div class="loading">Loading products...</div>
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
        is_active,
        created_at
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    allProducts = data || [];

    window.currentProducts = allProducts;

    displayProducts(allProducts);

  } catch (error) {

    console.error("Products error:", error);

    box.innerHTML = `
      <div class="loading">
        <h3>Unable to load products</h3>
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
      <div class="loading">
        <h3>No products available</h3>
        <p>Please check again later.</p>
      </div>
    `;

    return;

  }

  box.innerHTML = products.map(function (product) {

    const price = Number(product.price) || 0;

    const discount = Number(product.discount_price);

    const hasDiscount =
      Number.isFinite(discount) &&
      discount > 0 &&
      discount < price;

    const finalPrice = hasDiscount ? discount : price;

    const image =
      product.image_url ||
      "https://via.placeholder.com/500x500?text=MAYA+CLOTHING";

    const stock = Number(product.stock) || 0;

    return `
      <div class="product">

        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/500x500?text=MAYA+CLOTHING'"
        >

        <div class="product-info">

          <h3>${escapeHtml(product.name)}</h3>

          <div class="price">
            ₦${finalPrice.toLocaleString()}

            ${
              hasDiscount
                ? `<span class="old-price">
                     ₦${price.toLocaleString()}
                   </span>`
                : ""
            }
          </div>

          <div class="stock">
            ${
              stock > 0
                ? `In Stock: ${stock}`
                : "Out of Stock"
            }
          </div>

          <button
            class="add-btn"
            type="button"
            onclick="addToCart(${Number(product.id)})"
            ${stock <= 0 ? "disabled" : ""}
          >
            ${stock > 0 ? "🛒 Add to Cart" : "Out of Stock"}
          </button>

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
    <div class="loading">Loading products...</div>
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
        is_active,
        created_at
      `)
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    window.currentProducts = data || [];

    displayProducts(data || []);

  } catch (error) {

    console.error("Category error:", error);

    box.innerHTML = `
      <div class="loading">
        Unable to load category products.
      </div>
    `;

  }

}


// ==========================================
// SEARCH PRODUCTS
// ==========================================

function searchProducts() {

  const input = document.getElementById("search");

  if (!input) return;

  const searchText = input.value.trim().toLowerCase();

  const filtered = allProducts.filter(function (product) {

    const name = String(product.name || "").toLowerCase();

    const description =
      String(product.description || "").toLowerCase();

    return (
      name.includes(searchText) ||
      description.includes(searchText)
    );

  });

  window.currentProducts = filtered;

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

    const regularPrice = Number(product.price) || 0;

    const discountPrice = Number(product.discount_price);

    const price =
      Number.isFinite(discountPrice) &&
      discountPrice > 0 &&
      discountPrice < regularPrice
        ? discountPrice
        : regularPrice;

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

  alert("Product added to cart ✅");

}


// ==========================================
// LOAD CART
// ==========================================

function loadCart() {

  try {

    const saved = localStorage.getItem("maya_cart");

    cart = saved ? JSON.parse(saved) : [];

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

  const count = document.getElementById("cartCount");

  if (!count) return;

  const total = cart.reduce(function (sum, item) {

    return sum + Number(item.quantity || 0);

  }, 0);

  count.textContent = total;

}


// ==========================================
// OPEN CART
// ==========================================

function openCart() {

  renderCart();

  const modal = document.getElementById("cartModal");

  if (modal) {

    modal.style.display = "block";

  }

}


// ==========================================
// CLOSE CART
// ==========================================

function closeCart() {

  const modal = document.getElementById("cartModal");

  if (modal) {

    modal.style.display = "none";

  }

}


// ==========================================
// RENDER CART
// ==========================================

function renderCart() {

  const itemsBox = document.getElementById("cartItems");

  const totalBox = document.getElementById("cartTotal");

  if (!itemsBox || !totalBox) return;

  if (cart.length === 0) {

    itemsBox.innerHTML = `
      <div class="cart-empty">Your cart is empty.</div>
    `;

    totalBox.textContent = "₦0";

    return;

  }

  itemsBox.innerHTML = cart.map(function (item) {

    const subtotal =
      Number(item.price) * Number(item.quantity);

    const image =
      item.image_url ||
      "https://via.placeholder.com/100";

    return `
      <div class="cart-item">

        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(item.name)}"
        >

        <div class="cart-item-info">

          <h4>${escapeHtml(item.name)}</h4>

          <div class="cart-price">
            ₦${Number(item.price).toLocaleString()}
          </div>

          <div class="quantity-controls">

            <button
              type="button"
              onclick="changeQuantity(${Number(item.id)}, -1)"
            >−</button>

            <span>${Number(item.quantity)}</span>

            <button
              type="button"
              onclick="changeQuantity(${Number(item.id)}, 1)"
            >+</button>

          </div>

          <strong>₦${subtotal.toLocaleString()}</strong>

          <br>

          <button
            type="button"
            class="remove-btn"
            onclick="removeFromCart(${Number(item.id)})"
          >
            Remove
          </button>

        </div>
      </div>
    `;

  }).join("");

  const total = cart.reduce(function (sum, item) {

    return sum +
      Number(item.price) * Number(item.quantity);

  }, 0);

  totalBox.textContent =
    "₦" + total.toLocaleString();

}


// ==========================================
// CHANGE QUANTITY
// ==========================================

function changeQuantity(productId, change) {

  const item = cart.find(function (item) {

    return Number(item.id) === Number(productId);

  });

  if (!item) return;

  const quantity =
    Number(item.quantity) + Number(change);

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

    return Number(item.id) !== Number(productId);

  });

  saveCart();

  updateCart();

  renderCart();

}


// ==========================================
// CHECKOUT - OPEN FORM
// ==========================================

function checkout() {

  if (cart.length === 0) {

    alert("Your cart is empty.");

    return;

  }

  closeCart();

  const modal = document.getElementById("checkoutModal");

  const totalBox = document.getElementById("checkoutTotal");

  if (totalBox) {

    const total = cart.reduce(function (sum, item) {

      return sum +
        Number(item.price) * Number(item.quantity);

    }, 0);

    totalBox.textContent = formatMoney(total);

  }

  if (modal) {

    modal.style.display = "block";

  }

}


// ==========================================
// CLOSE CHECKOUT
// ==========================================

function closeCheckout() {

  const modal = document.getElementById("checkoutModal");

  if (modal) {

    modal.style.display = "none";

  }

}


// ==========================================
// SUBMIT CHECKOUT - PAYSTACK
// ==========================================

async function submitCheckout(event) {

  if (event) {

    event.preventDefault();

  }

  if (cart.length === 0) {

    alert("Your cart is empty.");

    return;

  }

  const form = document.getElementById("checkoutForm");

  const button = document.getElementById("payNowBtn");

  if (!form || !form.reportValidity()) {

    return;

  }

  const customer = {

    name: document.getElementById("customerName").value.trim(),

    phone: document.getElementById("customerPhone").value.trim(),

    whatsapp: document.getElementById("customerWhatsapp").value.trim(),

    email: document.getElementById("customerEmail").value.trim(),

    address: document.getElementById("customerAddress").value.trim(),

    city: document.getElementById("customerCity").value.trim(),

    state: document.getElementById("customerState").value.trim(),

    notes: document.getElementById("customerNotes").value.trim()

  };

  const items = cart.map(function (item) {

    return {

      id: Number(item.id),

      quantity: Number(item.quantity)

    };

  });

  const originalText = button.textContent;

  button.disabled = true;

  button.textContent = "Connecting to Paystack...";

  try {

    console.log("Sending checkout request...");

const { data, error } =
  await supabaseClient.functions.invoke(
    INITIALIZE_FUNCTION,
    {
      body: {
        ...customer,
        items: items
      }
    }
  );
      );

    if (error) {

      console.error("Supabase Function Error:", error);

      throw new Error(
        error.message || "Unable to contact payment server."
      );

    }

    console.log("Checkout response:", data);

    if (!data || data.success !== true || !data.authorization_url) {

      throw new Error(
        data?.error ||
        data?.message ||
        "Paystack did not return a payment link."
      );

    }

    const paymentUrl = new URL(data.authorization_url);

    if (
      paymentUrl.protocol !== "https:" ||
      paymentUrl.hostname !== "checkout.paystack.com"
    ) {

      throw new Error("Invalid Paystack payment address.");

    }

    button.textContent = "Opening Paystack...";

    window.location.assign(paymentUrl.href);

  } catch (error) {

    console.error("Checkout Error:", error);

    alert(
      "Payment Error:\n" +
      (error.message || "Please try again.")
    );

    button.disabled = false;

    button.textContent = originalText;

  }

}


// ==========================================
// SCROLL TO SHOP
// ==========================================

function scrollToShop() {

  const shop = document.getElementById("shop");

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

  return new Intl.NumberFormat("en-NG", {

    style: "currency",

    currency: "NGN",

    maximumFractionDigits: 0

  }).format(Number(amount) || 0);

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

window.checkout = checkout;

window.closeCheckout = closeCheckout;

window.submitCheckout = submitCheckout;

window.scrollToShop = scrollToShop;

window.verifyPaystackPayment = verifyPaystackPayment;


console.log(
  "MAYA CLOTHING PAYSTACK CHECKOUT + VERIFICATION READY"
);
