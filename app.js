// ==========================================
// MAYA CLOTHING
// CUSTOMER APP - STEP 1
// PRODUCTS ONLY
// ==========================================

const SUPABASE_URL = "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ==========================================
// PAGE START
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("MAYA CLOTHING STARTED");

  loadCategories();
  loadProducts();
});

// ==========================================
// LOAD CATEGORIES
// ==========================================

async function loadCategories() {
  const box = document.getElementById("categories");

  if (!box) return;

  box.innerHTML = "Loading categories...";

  const result = await supabaseClient
    .from("categories")
    .select("id, name, slug")
    .order("id", { ascending: true });

  if (result.error) {
    console.error("CATEGORY ERROR:", result.error);

    box.innerHTML =
      "Unable to load categories: " +
      result.error.message;

    return;
  }

  box.innerHTML = "";

  const allButton = document.createElement("button");

  allButton.type = "button";
  allButton.textContent = "All";

  allButton.onclick = function () {
    loadProducts();
  };

  box.appendChild(allButton);

  (result.data || []).forEach(function (category) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = category.name;

    button.onclick = function () {
      loadProductsByCategory(category.id);
    };

    box.appendChild(button);
  });
}

// ==========================================
// LOAD ALL PRODUCTS
// ==========================================

async function loadProducts() {
  const box = document.getElementById("products");

  if (!box) return;

  box.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;

  console.log("Loading products...");

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

  console.log("PRODUCT RESULT:", result);

  if (result.error) {
    console.error("PRODUCT ERROR:", result.error);

    box.innerHTML = `
      <div class="loading">
        <h3>Unable to load products</h3>
        <p>${result.error.message}</p>
      </div>
    `;

    return;
  }

  displayProducts(result.data || []);
}

// ==========================================
// LOAD PRODUCTS BY CATEGORY
// ==========================================

async function loadProductsByCategory(categoryId) {
  const box = document.getElementById("products");

  if (!box) return;

  box.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;

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
    console.error("CATEGORY PRODUCT ERROR:", result.error);

    box.innerHTML = `
      <div class="loading">
        <h3>Unable to load products</h3>
        <p>${result.error.message}</p>
      </div>
    `;

    return;
  }

  displayProducts(result.data || []);
}

// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {
  const box = document.getElementById("products");

  if (!box) return;

  if (!products.length) {
    box.innerHTML = `
      <div class="loading">
        <h3>No products available</h3>
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
      discount !== null
        ? discount
        : price;

    const image =
      product.image_url ||
      "https://via.placeholder.com/500x500?text=MAYA+CLOTHING";

    const stock =
      Number(product.stock) || 0;

    return `
      <div class="product">

        <img
          src="${image}"
          alt="${product.name}"
        >

        <div class="product-info">

          <h3>${product.name}</h3>

          <div class="price">
            ₦${finalPrice.toLocaleString()}
            
            ${
              discount !== null
                ? `<span class="old-price">
                    ₦${price.toLocaleString()}
                  </span>`
                : ""
            }
          </div>

          <div class="stock">
            ${
              stock > 0
                ? "In Stock: " + stock
                : "Out of Stock"
            }
          </div>

        </div>

      </div>
    `;

  }).join("");
}

// ==========================================
// SEARCH
// ==========================================

function searchProducts() {

  const input =
    document.getElementById("search");

  if (!input) return;

  const text =
    input.value.trim().toLowerCase();

  const cards =
    document.querySelectorAll(".product");

  cards.forEach(function (card) {

    const name =
      card.querySelector("h3");

    if (!name) return;

    const productName =
      name.textContent.toLowerCase();

    card.style.display =
      productName.includes(text)
        ? ""
        : "none";

  });
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
// GLOBAL FUNCTIONS
// ==========================================

window.loadProducts = loadProducts;

window.loadProductsByCategory =
  loadProductsByCategory;

window.searchProducts =
  searchProducts;

window.scrollToShop =
  scrollToShop;
