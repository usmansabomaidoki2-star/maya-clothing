// ============================================
// MAYA CLOTHING - ADMIN DASHBOARD
// ============================================

const SUPABASE_URL = "https://shvugtyxmcwsvlpnadjp.supabase.co";
const SUPABASE_KEY = "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ============================================
// ELEMENTS
// ============================================

const loginSection = document.getElementById("loginSection");
const loginForm = document.getElementById("loginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

const dashboard = document.getElementById("dashboard");

const totalOrders = document.getElementById("totalOrders");
const pendingOrders = document.getElementById("pendingOrders");
const processingOrders = document.getElementById("processingOrders");
const deliveredOrders = document.getElementById("deliveredOrders");
const totalSales = document.getElementById("totalSales");

const productForm = document.getElementById("productForm");
const productFormBox = document.getElementById("productFormBox");
const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productDiscountPrice = document.getElementById("productDiscountPrice");
const productStock = document.getElementById("productStock");
const productImage = document.getElementById("productImage");
const productSizes = document.getElementById("productSizes");
const productColors = document.getElementById("productColors");
const productDescription = document.getElementById("productDescription");
const saveProductBtn = document.getElementById("saveProductBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const addProductBtn = document.getElementById("addProductBtn");

const productsTableBody = document.getElementById("productsTableBody");

const ordersTableBody = document.getElementById("ordersTableBody");
const ordersMessage = document.getElementById("ordersMessage");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

const orderModal = document.getElementById("orderModal");
const modalOrderTitle = document.getElementById("modalOrderTitle");
const closeModalBtn = document.getElementById("closeModalBtn");
const orderDetails = document.getElementById("orderDetails");

// ============================================
// SHOW / HIDE
// ============================================

function showLogin() {
  if (loginSection) loginSection.style.display = "block";
  if (dashboard) dashboard.style.display = "none";
}

function showDashboard() {
  if (loginSection) loginSection.style.display = "none";
  if (dashboard) dashboard.style.display = "block";
}

function setMessage(element, message, type = "") {
  if (!element) return;

  element.textContent = message;
  element.className = type ? type : "";
}

// ============================================
// ADMIN CHECK
// ============================================

async function checkAdmin(userId) {
  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin check error:", error);
    return {
      isAdmin: false,
      error: error.message
    };
  }

  return {
    isAdmin: !!data,
    error: null
  };
}

// ============================================
// LOGIN
// ============================================

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = adminEmail.value.trim();
    const password = adminPassword.value;

    if (!email || !password) {
      setMessage(
        loginMessage,
        "Please enter email and password.",
        "error-message"
      );
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    setMessage(loginMessage, "");

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

      if (error) {
        console.error("Login error:", error);

        setMessage(
          loginMessage,
          error.message,
          "error-message"
        );

        return;
      }

      if (!data || !data.user) {
        setMessage(
          loginMessage,
          "Login failed. User account was not returned.",
          "error-message"
        );

        return;
      }

      const adminCheck = await checkAdmin(data.user.id);

      if (adminCheck.error) {
        setMessage(
          loginMessage,
          "Login succeeded, but admin verification failed: " +
            adminCheck.error,
          "error-message"
        );

        return;
      }

      if (!adminCheck.isAdmin) {
        await supabaseClient.auth.signOut();

        setMessage(
          loginMessage,
          "This account is not an authorized admin account.",
          "error-message"
        );

        return;
      }

      setMessage(
        loginMessage,
        "Login successful!",
        "success-message"
      );

      showDashboard();

      await initializeDashboard();

    } catch (error) {
      console.error("Unexpected login error:", error);

      setMessage(
        loginMessage,
        "Unexpected error: " + error.message,
        "error-message"
      );
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}

// ============================================
// LOGOUT
// ============================================

async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  }

  showLogin();

  if (loginMessage) {
    setMessage(loginMessage, "");
  }

  if (adminPassword) {
    adminPassword.value = "";
  }
}

window.logout = logout;

// ============================================
// INITIALIZE
// ============================================

async function initializeAdmin() {
  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      showLogin();
      return;
    }

    if (!session || !session.user) {
      showLogin();
      return;
    }

    const adminCheck = await checkAdmin(session.user.id);

    if (adminCheck.error || !adminCheck.isAdmin) {
      await supabaseClient.auth.signOut();
      showLogin();
      return;
    }

    showDashboard();

    await initializeDashboard();

  } catch (error) {
    console.error("Initialization error:", error);
    showLogin();
  }
}

// ============================================
// DASHBOARD
// ============================================

async function initializeDashboard() {
  await loadStats();
  await loadCategories();
  await loadProducts();
  await loadOrders();
}

// ============================================
// STATS
// ============================================

async function loadStats() {
  try {
    const { data: orders, error } = await supabaseClient
      .from("orders")
      .select("id,total_amount,status");

    if (error) {
      console.error("Stats error:", error);
      return;
    }

    const allOrders = orders || [];

    const pending = allOrders.filter(
      order => order.status === "pending"
    ).length;

    const processing = allOrders.filter(
      order => order.status === "processing"
    ).length;

    const delivered = allOrders.filter(
      order => order.status === "delivered"
    ).length;

    const sales = allOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    if (totalOrders) {
      totalOrders.textContent = allOrders.length;
    }

    if (pendingOrders) {
      pendingOrders.textContent = pending;
    }

    if (processingOrders) {
      processingOrders.textContent = processing;
    }

    if (deliveredOrders) {
      deliveredOrders.textContent = delivered;
    }

    if (totalSales) {
      totalSales.textContent =
        "₦" + sales.toLocaleString("en-NG");
    }

  } catch (error) {
    console.error("loadStats error:", error);
  }
}

// ============================================
// CATEGORIES
// ============================================

async function loadCategories() {
  if (!productCategory) return;

  const { data, error } = await supabaseClient
    .from("categories")
    .select("id,name")
    .order("name");

  if (error) {
    console.error("Category error:", error);
    return;
  }

  productCategory.innerHTML =
    '<option value="">Select Category</option>';

  (data || []).forEach(category => {
    const option = document.createElement("option");

    option.value = category.id;
    option.textContent = category.name;

    productCategory.appendChild(option);
  });
}

// ============================================
// PRODUCTS
// ============================================

async function loadProducts() {
  if (!productsTableBody) return;

  productsTableBody.innerHTML =
    '<tr><td colspan="7">Loading products...</td></tr>';

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
      created_at,
      categories (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products error:", error);

    productsTableBody.innerHTML =
      `<tr><td colspan="7">Error: ${escapeHtml(error.message)}</td></tr>`;

    return;
  }

  if (!data || data.length === 0) {
    productsTableBody.innerHTML =
      '<tr><td colspan="7">No products found.</td></tr>';

    return;
  }

  productsTableBody.innerHTML = "";

  data.forEach(product => {
    const row = document.createElement("tr");

    const categoryName =
      product.categories?.name || "No Category";

    const image = product.image_url
      ? `<img src="${escapeHtml(product.image_url)}"
              alt="${escapeHtml(product.name)}"
              style="width:55px;height:55px;object-fit:cover;border-radius:8px;">`
      : "No Image";

    const price = Number(product.price || 0);
    const discount = product.discount_price !== null
      ? Number(product.discount_price)
      : null;

    let priceHtml = `₦${price.toLocaleString("en-NG")}`;

    if (discount !== null && discount < price) {
      priceHtml = `
        <div>
          <span style="text-decoration:line-through;">
            ₦${price.toLocaleString("en-NG")}
          </span>
          <br>
          <strong>
            ₦${discount.toLocaleString("en-NG")}
          </
