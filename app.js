// ======================================================
// MAYA CLOTHING - CUSTOMER APP
// ======================================================

// ------------------------------
// SUPABASE CONFIG
// ------------------------------

const SUPABASE_URL = "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let allProducts = [];
let cart = [];


// ======================================================
// LOAD CATEGORIES
// ======================================================

async function loadCategories() {
  const categoriesContainer = document.getElementById("categories");

  if (!categoriesContainer) return;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("id", { ascending: true });

    console.log("MAYA CATEGORIES:", data);
    console.log("MAYA CATEGORY ERROR:", error);

    if (error) {
      console.error("Category error:", error);
      return;
    }

    categoriesContainer.innerHTML = `
      <button onclick="loadProducts()" class="category-btn active">
        All
      </button>
    `;

    if (!data || data.length === 0) return;

    data.forEach(category => {
      const button = document.createElement("button");

      button.className = "category-btn";

      button.textContent = category.name;

      button.onclick = () => {
        loadProducts(category.id);
      };

      categoriesContainer.appendChild(button);
    });

  } catch (error) {
    console.error("LOAD CATEGORIES ERROR:", error);
  }
}


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts(categoryId = null) {

  const productsContainer =
    document.getElementById("products");

  if (!productsContainer) return;

  productsContainer.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;

  try {

    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        discount_price,
        stock,
        image_url,
        sizes,
        colors,
        category_id,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    console.log("MAYA PRODUCTS:", data);
    console.log("MAYA PRODUCT ERROR:", error);

    if (error) {

      productsContainer.innerHTML = `
        <div class="loading">
          ❌ Error loading products:
          <br><br>
          ${escapeHtml(error.message)}
        </div>
      `;

      return;
    }

    if (!data || data.length === 0) {

      productsContainer.innerHTML = `
        <div class="loading">
          No products found.
        </div>
      `;

      allProducts = [];

      return;
    }

    allProducts = data;

    displayProducts(data);

  } catch (error) {

    console.error(
      "MAYA LOAD PRODUCTS ERROR:",
      error
    );

    productsContainer.innerHTML = `
      <div class="loading">
        ❌ Something went wrong.
        <br><br>
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}


// ======================================================
// DISPLAY PRODUCTS
// ======================================================

function displayProducts(products) {

  const productsContainer =
    document.getElementById("products");

  if (!productsContainer) return;

  if (!products || products.length === 0) {

    productsContainer.innerHTML = `
      <div class="loading">
        No products found.
      </div>
    `;

    return;
  }

  productsContainer.innerHTML = "";

  products.forEach(product => {

    const card = document.createElement("div");

    card.className = "product-card";

    const price =
      Number(product.price || 0);

    const discountPrice =
      product.discount_price !== null &&
      product.discount_price !== undefined
        ? Number(product.discount_price)
        : null;

    const finalPrice =
      discountPrice !== null &&
      discountPrice > 0 &&
      discountPrice < price
        ? discountPrice
        : price;

    const image =
      product.image_url ||
      "https://placehold.co/600x600?text=MAYA+CLOTHING";

    let priceHTML = "";

    if (
      discountPrice !== null &&
      discountPrice > 0 &&
      discountPrice < price
    ) {

      priceHTML = `
        <div class="product-price">
          <span class="old-price">
            ${formatMoney(price)}
          </span>

          <span class="sale-price">
            ${formatMoney(discountPrice)}
          </span>
        </div>
      `;

    } else {

      priceHTML = `
        <div class="product-price">
          <span class="sale-price">
            ${formatMoney(price)}
          </span>
        </div>
      `;
    }

    let categoryName = "";

    if (
      product.categories &&
      product.categories.name
    ) {
      categoryName =
        product.categories.name;
    }

    card.innerHTML = `
      <div class="product-image-box">

        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          class="product-image"
          loading="lazy"
          onerror="this.src='https://placehold.co/600x600?text=MAYA+CLOTHING'"
        >

      </div>

      <div class="product-info">

        ${
          categoryName
            ? `<small class="product-category">
                ${escapeHtml(categoryName)}
              </small>`
            : ""
        }

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        ${
          product.description
            ? `<p class="product-description">
                ${escapeHtml(product.description)}
              </p>`
            : ""
        }

        ${priceHTML}

        <p class="product-stock">
          ${
            Number(product.stock || 0) > 0
              ? `Stock: ${product.stock}`
              : "Out of stock"
          }
        </p>

        <button
          class="add-cart-btn"
          onclick="addToCart(${product.id})"
          ${
            Number(product.stock || 0) <= 0
              ? "disabled"
              : ""
          }
        >
          ${
            Number(product.stock || 0) > 0
              ? "🛒 Add to Cart"
              : "Out of Stock"
          }
        </button>

      </div>
    `;

    productsContainer.appendChild(card);
  });
}


// ======================================================
// CATEGORY FILTER
// ======================================================

function filterCategory(categoryId) {
  loadProducts(categoryId);
}


// ======================================================
// SEARCH PRODUCTS
// ======================================================

function searchProducts() {

  const searchInput =
    document.getElementById("search");

  if (!searchInput) return;

  const searchText =
    searchInput.value
      .trim()
      .toLowerCase();

  if (!searchText) {

    displayProducts(allProducts);

    return;
  }

  const filteredProducts =
    allProducts.filter(product => {

      const name =
        String(product.name || "")
          .toLowerCase();

      const description =
        String(product.description || "")
          .toLowerCase();

      const category =
        product.categories &&
        product.categories.name
          ? product.categories.name.toLowerCase()
          : "";

      return (
        name.includes(searchText) ||
        description.includes(searchText) ||
        category.includes(searchText)
      );
    });

  displayProducts(filteredProducts);
}


// ======================================================
// CART
// ======================================================

function addToCart(productId) {

  const product =
    allProducts.find(
      item => Number(item.id) === Number(productId)
    );

  if (!product) {

    alert("Product not found.");

    return;
  }

  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {

    alert("This product is out of stock.");

    return;
  }

  const existing =
    cart.find(
      item => Number(item.id) === Number(productId)
    );

  if (existing) {

    if (existing.quantity >= stock) {

      alert(
        `Only ${stock} item(s) available in stock.`
      );

      return;
    }

    existing.quantity += 1;

  } else {

    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      discount_price:
        product.discount_price !== null
          ? Number(product.discount_price)
          : null,
      image_url: product.image_url,
      stock: stock,
      quantity: 1
    });
  }

  saveCart();

  updateCart();

  alert(
    `${product.name} added to cart.`
  );
}


// ======================================================
// GET FINAL PRODUCT PRICE
// ======================================================

function getProductPrice(product) {

  const price =
    Number(product.price || 0);

  const discount =
    product.discount_price !== null &&
    product.discount_price !== undefined
      ? Number(product.discount_price)
      : null;

  if (
    discount !== null &&
    discount > 0 &&
    discount < price
  ) {
    return discount;
  }

  return price;
}


// ======================================================
// UPDATE CART COUNT
// ======================================================

function updateCart() {

  const cartCount =
    document.getElementById("cartCount");

  if (!cartCount) return;

  const count =
    cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

  cartCount.textContent = count;
}


// ======================================================
// OPEN CART
// ======================================================

function openCart() {

  const modal =
    document.getElementById("cartModal");

  if (!modal) return;

  renderCart();

  modal.classList.add("show");

  modal.style.display = "flex";
}


// ======================================================
// CLOSE CART
// ======================================================

function closeCart() {

  const modal =
    document.getElementById("cartModal");

  if (!modal) return;

  modal.classList.remove("show");

  modal.style.display = "none";
}


// ======================================================
// RENDER CART
// ======================================================

function renderCart() {

  const cartItems =
    document.getElementById("cartItems");

  const cartTotal =
    document.getElementById("cartTotal");

  if (!cartItems) return;

  if (!cart || cart.length === 0) {

    cartItems.innerHTML = `
      <div class="empty-cart">
        <p>🛒 Your cart is empty.</p>
      </div>
    `;

    if (cartTotal) {
      cartTotal.textContent = "₦0";
    }

    return;
  }

  cartItems.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    const unitPrice =
      getProductPrice(item);

    const subtotal =
      unitPrice * Number(item.quantity || 0);

    total += subtotal;

    const image =
      item.image_url ||
      "https://placehold.co/150x150?text=MAYA";

    const div =
      document.createElement("div");

    div.className = "cart-item";

    div.innerHTML = `
      <div class="cart-item-image">
        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(item.name)}"
          onerror="this.src='https://placehold.co/150x150?text=MAYA'"
        >
      </div>

      <div class="cart-item-info">

        <h4>
          ${escapeHtml(item.name)}
        </h4>

        <p>
          ${formatMoney(unitPrice)}
        </p>

        <div class="quantity-controls">

          <button
            onclick="changeQuantity(${item.id}, -1)"
          >
            −
          </button>

          <span>
            ${item.quantity}
          </span>

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
          class="remove-btn"
          onclick="removeFromCart(${item.id})"
        >
          Remove
        </button>

      </div>
    `;

    cartItems.appendChild(div);
  });

  if (cartTotal) {
    cartTotal.textContent =
      formatMoney(total);
  }
}


// ======================================================
// CHANGE QUANTITY
// ======================================================

function changeQuantity(productId, change) {

  const item =
    cart.find(
      item => Number(item.id) === Number(productId)
    );

  if (!item) return;

  const newQuantity =
    Number(item.quantity) + Number(change);

  if (newQuantity <= 0) {

    removeFromCart(productId);

    return;
  }

  if (newQuantity > Number(item.stock || 0)) {

    alert(
      `Only ${item.stock} item(s) available.`
    );

    return;
  }

  item.quantity = newQuantity;

  saveCart();

  updateCart();

  renderCart();
}


// ======================================================
// REMOVE FROM CART
// ======================================================

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        Number(item.id) !== Number(productId)
    );

  saveCart();

  updateCart();

  renderCart();
}


// ======================================================
// SAVE CART
// ======================================================

function saveCart() {

  try {

    localStorage.setItem(
      "maya_clothing_cart",
      JSON.stringify(cart)
    );

  } catch (error) {

    console.error(
      "Could not save cart:",
      error
    );
  }
}


// ======================================================
// LOAD CART
// ======================================================

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        "maya_clothing_cart"
      );

    if (!saved) {

      cart = [];

      return;
    }

    const parsed =
      JSON.parse(saved);

    if (Array.isArray(parsed)) {

      cart = parsed;

    } else {

      cart = [];
    }

  } catch (error) {

    console.error(
      "Could not load cart:",
      error
    );

    cart = [];
  }
}


// ======================================================
// OPEN CHECKOUT
// ======================================================

function openCheckout() {

  if (!cart || cart.length === 0) {

    alert(
      "Your cart is empty. Please add a product first."
    );

    return;
  }

  renderCheckoutTotal();

  const cartModal =
    document.getElementById("cartModal");

  const checkoutModal =
    document.getElementById("checkoutModal");

  if (cartModal) {

    cartModal.classList.remove("show");

    cartModal.style.display = "none";
  }

  if (checkoutModal) {

    checkoutModal.classList.add("show");

    checkoutModal.style.display = "flex";
  }
}


// ======================================================
// CLOSE CHECKOUT
// ======================================================

function closeCheckout() {

  const checkoutModal =
    document.getElementById("checkoutModal");

  if (!checkoutModal) return;

  checkoutModal.classList.remove("show");

  checkoutModal.style.display = "none";
}


// ======================================================
// RENDER CHECKOUT TOTAL
// ======================================================

function renderCheckoutTotal() {

  const checkoutTotal =
    document.getElementById("checkoutTotal");

  if (!checkoutTotal) return;

  const total =
    calculateCartTotal();

  checkoutTotal.textContent =
    formatMoney(total);
}


// ======================================================
// CALCULATE CART TOTAL
// ======================================================

function calculateCartTotal() {

  return cart.reduce(
    (total, item) => {

      const price =
        getProductPrice(item);

      const quantity =
        Number(item.quantity || 0);

      return total + (price * quantity);

    },
    0
  );
}


// ======================================================
// SUBMIT ORDER
// ======================================================

async function submitOrder(event) {

  event.preventDefault();

  const message =
    document.getElementById("checkoutMessage");

  const button =
    document.getElementById("placeOrderBtn");

  if (!cart || cart.length === 0) {

    if (message) {
      message.textContent =
        "Your cart is empty.";
    }

    return;
  }

  const customerName =
    document.getElementById("customerName")?.value.trim();

  const customerPhone =
    document.getElementById("customerPhone")?.value.trim();

  const customerWhatsapp =
    document.getElementById("customerWhatsapp")?.value.trim();

  const customerEmail =
    document.getElementById("customerEmail")?.value.trim();

  const customerAddress =
    document.getElementById("customerAddress")?.value.trim();

  const customerCity =
    document.getElementById("customerCity")?.value.trim();

  const customerState =
    document.getElementById("customerState")?.value.trim();

  const orderNotes =
    document.getElementById("orderNotes")?.value.trim();


  if (!customerName) {

    showCheckoutMessage(
      "Please enter your full name.",
      true
    );

    return;
  }


  if (!customerPhone) {

    showCheckoutMessage(
      "Please enter your phone number.",
      true
    );

    return;
  }


  if (!customerAddress) {

    showCheckoutMessage(
      "Please enter your delivery address.",
      true
    );

    return;
  }


  const orderItems =
    cart.map(item => ({

      product_id: Number(item.id),

      quantity:
        Number(item.quantity || 1)

    }));


  if (button) {

    button.disabled = true;

    button.textContent =
      "Placing Order...";
  }


  showCheckoutMessage(
    "Please wait..."
  );


  try {

    const { data, error } =
      await supabase.rpc(
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
          p_items: orderItems
        }
      );


    console.log(
      "CREATE ORDER DATA:",
      data
    );

    console.log(
      "CREATE ORDER ERROR:",
      error
    );


    if (error) {

      console.error(
        "Order error:",
        error
      );

      showCheckoutMessage(
        error.message ||
        "Could not place your order.",
        true
      );

      return;
    }


    if (!data || data.success !== true) {

      showCheckoutMessage(
        data?.message ||
        "Could not place your order.",
        true
      );

      return;
    }


    const orderId =
      data.order_id;


    const totalAmount =
      Number(
        data.total_amount ||
        calculateCartTotal()
      );


    cart = [];

    saveCart();

    updateCart();


    const form =
      document.getElementById("checkoutForm");

    if (form) {
      form.reset();
    }


    renderCart();


    showCheckoutMessage(
      `Order placed successfully! Order ID: #${orderId}`
    );


    if (button) {

      button.textContent =
        "Order Placed";

    }


    setTimeout(() => {

      closeCheckout();

      const messageBox =
        document.getElementById(
          "checkoutMessage"
        );

      if (messageBox) {
        messageBox.textContent = "";
      }

      if (button) {

        button.disabled = false;

        button.textContent =
          "Place Order";
      }

    }, 4000);


  } catch (error) {

    console.error(
      "SUBMIT ORDER ERROR:",
      error
    );

    showCheckoutMessage(
      error.message ||
      "Something went wrong while placing the order.",
      true
    );

  } finally {

    if (
      button &&
      button.textContent !== "Order Placed"
    ) {

      button.disabled = false;

      button.textContent =
        "Place Order";
    }
  }
}


// ======================================================
// CHECKOUT MESSAGE
// ======================================================

function showCheckoutMessage(
  text,
  isError = false
) {

  const message =
    document.getElementById(
      "checkoutMessage"
    );

  if (!message) return;

  message.textContent = text;

  message.style.display = "block";

  message.style.padding = "10px";

  message.style.marginTop = "10px";

  message.style.borderRadius = "8px";

  if (isError) {

    message.style.background =
      "#ffe5e5";

    message.style.color =
      "#b00020";

  } else {

    message.style.background =
      "#e7f8ed";

    message.style.color =
      "#137333";
  }
}


// ======================================================
// SCROLL TO SHOP
// ======================================================

function scrollToShop() {

  const shop =
    document.getElementById("shop");

  if (!shop) return;

  shop.scrollIntoView({
    behavior: "smooth"
  });
}


// ======================================================
// MONEY FORMAT
// ======================================================

function formatMoney(amount) {

  const number =
    Number(amount || 0);

  return (
    "₦" +
    number.toLocaleString(
      "en-NG",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )
  );
}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

  return escapeHtml(value);
}


// ======================================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// ======================================================

window.addEventListener(
  "click",
  function(event) {

    const cartModal =
      document.getElementById("cartModal");

    const checkoutModal =
      document.getElementById("checkoutModal");


    if (
      cartModal &&
      event.target === cartModal
    ) {

      closeCart();
    }


    if (
      checkoutModal &&
      event.target === checkoutModal
    ) {

      closeCheckout();
    }

  }
);


// ======================================================
// INITIALIZE APP
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    console.log(
      "MAYA CLOTHING APP.JS LOADED"
    );

    loadCart();

    updateCart();

    await loadCategories();

    await loadProducts();

    updateCart();

  }
);


// ======================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ======================================================

window.loadProducts = loadProducts;
window.filterCategory = filterCategory;
window.searchProducts = searchProducts;

window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;

window.openCart = openCart;
window.closeCart = closeCart;

window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;

window.submitOrder = submitOrder;

window.scrollToShop = scrollToShop;
