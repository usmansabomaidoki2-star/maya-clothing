// ============================================================
// MAYA CLOTHING - ADMIN PANEL
// Supabase + Login + Products + Orders
// ============================================================

const SUPABASE_URL = "https://shvugtyxmcwsvlpnadjp.supabase.co";
const SUPABASE_KEY = "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ============================================================
// GLOBALS
// ============================================================

let editingProductId = null;
let categoriesCache = [];

// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", async function () {

  console.log("MAYA ADMIN JS LOADED");

  setupLogin();
  setupDashboardButtons();
  setupProductForm();
  setupOrderButtons();

  await checkExistingSession();

});


// ============================================================
// LOGIN
// ============================================================

function setupLogin() {

  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error("loginForm not found");
    return;
  }

  loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");
    const loginBtn = document.getElementById("loginBtn");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
      showLoginMessage("Please enter email and password.", "red");
      return;
    }

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";
    }

    showLoginMessage("Ana duba login...", "blue");

    try {

      console.log("Trying Supabase login...");

      const result = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      const data = result.data;
      const error = result.error;

      console.log("LOGIN RESPONSE:", data, error);

      if (error) {

        console.error("LOGIN ERROR:", error);

        showLoginMessage(
          "Login Error: " + error.message,
          "red"
        );

        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        }

        return;
      }

      if (!data || !data.user) {

        showLoginMessage(
          "Login bai dawo da user ba.",
          "red"
        );

        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        }

        return;
      }

      console.log("USER:", data.user);

      const userId = data.user.id;

      // ======================================================
      // CHECK ADMIN USER
      // ======================================================

      const adminResult = await supabaseClient
        .from("admin_users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      const adminUser = adminResult.data;
      const adminError = adminResult.error;

      console.log("ADMIN CHECK:", adminUser, adminError);

      if (adminError) {

        console.error("ADMIN CHECK ERROR:", adminError);

        showLoginMessage(
          "An samu login amma an kasa tabbatar da Admin: " +
          adminError.message,
          "red"
        );

        await supabaseClient.auth.signOut();

        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        }

        return;
      }

      if (!adminUser) {

        await supabaseClient.auth.signOut();

        showLoginMessage(
          "Wannan account ba Admin bane.",
          "red"
        );

        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        }

        return;
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      showLoginMessage(
        "Login successful! Ana bude Admin Dashboard...",
        "green"
      );

      console.log("ADMIN LOGIN SUCCESS");

      await showDashboard();

    } catch (error) {

      console.error("UNEXPECTED LOGIN ERROR:", error);

      showLoginMessage(
        "An samu kuskure: " + error.message,
        "red"
      );

      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      }

    }

  });

}


// ============================================================
// CHECK EXISTING SESSION
// ============================================================

async function checkExistingSession() {

  try {

    const result = await supabaseClient.auth.getSession();

    const session = result.data ? result.data.session : null;
    const error = result.error;

    if (error) {
      console.error("SESSION ERROR:", error);
      return;
    }

    if (!session || !session.user) {
      showLoginSection();
      return;
    }

    console.log("Existing session found:", session.user.email);

    const adminResult = await supabaseClient
      .from("admin_users")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (adminResult.error) {
      console.error("ADMIN SESSION CHECK:", adminResult.error);
      showLoginSection();
      return;
    }

    if (!adminResult.data) {
      await supabaseClient.auth.signOut();
      showLoginSection();
      return;
    }

    await showDashboard();

  } catch (error) {

    console.error("SESSION CHECK ERROR:", error);

    showLoginSection();

  }

}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLoginSection() {

  const loginSection = document.getElementById("loginSection");
  const dashboard = document.getElementById("dashboard");

  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }

}


// ============================================================
// SHOW DASHBOARD
// ============================================================

async function showDashboard() {

  const loginSection = document.getElementById("loginSection");
  const dashboard = document.getElementById("dashboard");

  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "block";
  }

  await loadDashboardData();

}


// ============================================================
// LOGIN MESSAGE
// ============================================================

function showLoginMessage(message, color) {

  const box = document.getElementById("loginMessage");

  if (!box) {
    console.log(message);
    return;
  }

  box.textContent = message;
  box.style.display = "block";
  box.style.color = color || "red";

}


// ============================================================
// DASHBOARD BUTTONS
// ============================================================

function setupDashboardButtons() {

  const logoutBtn =
    document.getElementById("logoutBtn") ||
    document.getElementById("adminLogoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

      try {

        await supabaseClient.auth.signOut();

        window.location.reload();

      } catch (error) {

        console.error("LOGOUT ERROR:", error);

      }

    });

  }


  const addProductBtn =
    document.getElementById("addProductBtn");

  if (addProductBtn) {

    addProductBtn.addEventListener("click", function () {

      openProductForm();

    });

  }


  const refreshOrdersBtn =
    document.getElementById("refreshOrdersBtn");

  if (refreshOrdersBtn) {

    refreshOrdersBtn.addEventListener("click", async function () {

      await loadOrders();

    });

  }

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboardData() {

  console.log("Loading dashboard...");

  await loadCategories();
  await loadProducts();
  await loadOrders();
  await loadStatistics();

}


// ============================================================
// CATEGORIES
// ============================================================

async function loadCategories() {

  try {

    const result = await supabaseClient
      .from("categories")
      .select("*")
      .order("name");

    if (result.error) {
      console.error("CATEGORY ERROR:", result.error);
      return;
    }

    categoriesCache = result.data || [];

    const select =
      document.getElementById("productCategory");

    if (!select) return;

    select.innerHTML =
      '<option value="">Select Category</option>';

    categoriesCache.forEach(function (category) {

      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      select.appendChild(option);

    });

  } catch (error) {

    console.error("CATEGORY LOAD ERROR:", error);

  }

}


// ============================================================
// PRODUCTS
// ============================================================

async function loadProducts() {

  const tbody =
    document.getElementById("productsTableBody");

  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="7">Loading products...</td></tr>';

  try {

    const result = await supabaseClient
      .from("products")
      .select(`
        *,
        categories (
          name
        )
      `)
      .order("created_at", {
        ascending: false
      });

    if (result.error) {

      console.error("PRODUCT LOAD ERROR:", result.error);

      tbody.innerHTML =
        `<tr>
          <td colspan="7">
            Error: ${escapeHtml(result.error.message)}
          </td>
        </tr>`;

      return;
    }

    const products = result.data || [];

    if (products.length === 0) {

      tbody.innerHTML =
        '<tr><td colspan="7">No products found.</td></tr>';

      return;
    }

    tbody.innerHTML = "";

    products.forEach(function (product) {

      const tr = document.createElement("tr");

      const image = product.image_url
        ? `<img src="${escapeHtml(product.image_url)}"
             style="width:50px;height:50px;object-fit:cover;border-radius:6px;">`
        : "No image";

      const categoryName =
        product.categories
          ? product.categories.name
          : "-";

      const price =
        Number(product.price || 0).toLocaleString();

      const discount =
        product.discount_price
          ? "₦" +
            Number(product.discount_price).toLocaleString()
          : "-";

      tr.innerHTML = `
        <td>${image}</td>

        <td>
          <strong>${escapeHtml(product.name)}</strong>
        </td>

        <td>${escapeHtml(categoryName)}</td>

        <td>₦${price}</td>

        <td>${discount}</td>

        <td>${product.stock ?? 0}</td>

        <td>
          <button
            type="button"
            onclick="editProduct(${product.id})">
            Edit
          </button>

          <button
            type="button"
            onclick="deleteProduct(${product.id})">
            Delete
          </button>
        </td>
      `;

      tbody.appendChild(tr);

    });

  } catch (error) {

    console.error("PRODUCT ERROR:", error);

    tbody.innerHTML =
      `<tr>
        <td colspan="7">
          ${escapeHtml(error.message)}
        </td>
      </tr>`;

  }

}


// ============================================================
// PRODUCT FORM
// ============================================================

function setupProductForm() {

  const form =
    document.getElementById("productForm");

  if (!form) return;

  form.addEventListener("submit", async function (event) {

    event.preventDefault();

    await saveProduct();

  });


  const cancelBtn =
    document.getElementById("cancelProductBtn");

  if (cancelBtn) {

    cancelBtn.addEventListener("click", function () {

      closeProductForm();

    });

  }

}


// ============================================================
// OPEN PRODUCT FORM
// ============================================================

function openProductForm(product = null) {

  const box =
    document.getElementById("productFormBox");

  if (box) {
    box.style.display = "block";
  }

  const form =
    document.getElementById("productForm");

  if (form) {
    form.reset();
  }

  editingProductId = null;

  const productId =
    document.getElementById("productId");

  if (productId) {
    productId.value = "";
  }

  if (product) {

    editingProductId = product.id;

    setValue("productId", product.id);
    setValue("productName", product.name);
    setValue("productCategory", product.category_id);
    setValue("productPrice", product.price);
    setValue(
      "productDiscountPrice",
      product.discount_price || ""
    );
    setValue("productStock", product.stock || 0);
    setValue("productImage", product.image_url || "");
    setValue(
      "productSizes",
      Array.isArray(product.sizes)
        ? product.sizes.join(", ")
        : ""
    );
    setValue(
      "productColors",
      Array
