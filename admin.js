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
const productDiscountPrice =
  document.getElementById("productDiscountPrice");
const productStock = document.getElementById("productStock");
const productImage = document.getElementById("productImage");
const productSizes = document.getElementById("productSizes");
const productColors = document.getElementById("productColors");
const productDescription =
  document.getElementById("productDescription");

const saveProductBtn =
  document.getElementById("saveProductBtn");

const cancelProductBtn =
  document.getElementById("cancelProductBtn");

const addProductBtn =
  document.getElementById("addProductBtn");

const productsTableBody =
  document.getElementById("productsTableBody");

const ordersTableBody =
  document.getElementById("ordersTableBody");

const ordersMessage =
  document.getElementById("ordersMessage");

const refreshOrdersBtn =
  document.getElementById("refreshOrdersBtn");

const orderModal =
  document.getElementById("orderModal");

const modalOrderTitle =
  document.getElementById("modalOrderTitle");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const orderDetails =
  document.getElementById("orderDetails");

// ============================================
// DISPLAY
// ============================================

function showLogin() {
  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }
}

function showDashboard() {
  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "block";
  }
}

function showLoginMessage(message, type = "") {
  if (!loginMessage) return;

  loginMessage.textContent = message;

  if (type) {
    loginMessage.className = type;
  } else {
    loginMessage.className = "";
  }
}

// ============================================
// CHECK ADMIN
// ============================================

async function checkAdmin(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("admin_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("ADMIN CHECK ERROR:", error);

      return {
        isAdmin: false,
        error: error.message
      };
    }

    return {
      isAdmin: !!data,
      error: null
    };

  } catch (error) {
    console.error("ADMIN CHECK EXCEPTION:", error);

    return {
      isAdmin: false,
      error: error.message
    };
  }
}

// ============================================
// LOGIN
// ============================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const email = adminEmail
        ? adminEmail.value.trim()
        : "";

      const password = adminPassword
        ? adminPassword.value
        : "";

      if (!email || !password) {

        showLoginMessage(
          "Please enter email and password.",
          "error-message"
        );

        return;
      }

      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";
      }

      showLoginMessage("");

      try {

        console.log("LOGIN STARTED");

        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
          });

        console.log("LOGIN RESPONSE:", data, error);

        if (error) {

          console.error(
            "SUPABASE LOGIN ERROR:",
            error
          );

          showLoginMessage(
            "Login Error: " + error.message,
            "error-message"
          );

          return;
        }

        if (!data || !data.user) {

          showLoginMessage(
            "Login failed: No user account returned.",
            "error-message"
          );

          return;
        }

        console.log(
          "USER LOGIN SUCCESS:",
          data.user.id,
          data.user.email
        );

        showLoginMessage(
          "Login successful. Checking admin account...",
          "success-message"
        );

        const adminCheck =
          await checkAdmin(data.user.id);

        console.log(
          "ADMIN CHECK RESULT:",
          adminCheck
        );

        if (adminCheck.error) {

          showLoginMessage(
            "Admin verification error: " +
            adminCheck.error,
            "error-message"
          );

          return;
        }

        if (!adminCheck.isAdmin) {

          showLoginMessage(
            "Login successful, but this account is not an admin.",
            "error-message"
          );

          console.error(
            "NOT ADMIN:",
            data.user.id
          );

          return;
        }

        console.log(
          "ADMIN VERIFIED SUCCESSFULLY"
        );

        showDashboard();

        await initializeDashboard();

      } catch (error) {

        console.error(
          "LOGIN EXCEPTION:",
          error
        );

        showLoginMessage(
          "Unexpected Error: " +
          error.message,
          "error-message"
        );

      } finally {

        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        }
      }
    }
  );
}

// ============================================
// LOGOUT
// ============================================

async function logout() {

  try {

    await supabaseClient.auth.signOut();

    showLogin();

    if (adminPassword) {
      adminPassword.value = "";
    }

    showLoginMessage("");

  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );
  }
}

window.logout = logout;

// ============================================
// INITIAL ADMIN CHECK
// ============================================

async function initializeAdmin() {

  try {

    console.log(
      "CHECKING EXISTING SESSION..."
    );

    const {
      data: {
        session
      },
      error
    } =
      await supabaseClient.auth.getSession();

    console.log(
      "CURRENT SESSION:",
      session
    );

    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      showLogin();
      return;
    }

    if (!session || !session.user) {

      console.log(
        "NO ACTIVE SESSION"
      );

      showLogin();
      return;
    }

    console.log(
      "ACTIVE USER:",
      session.user.email
    );

    const adminCheck =
      await checkAdmin(session.user.id);

    console.log(
      "INITIAL ADMIN CHECK:",
      adminCheck
    );

    if (adminCheck.error) {

      showLogin();

      showLoginMessage(
        "Admin verification error: " +
        adminCheck.error,
        "error-message"
      );

      return;
    }

    if (!adminCheck.isAdmin) {

      showLogin();

      showLoginMessage(
        "This account is not an admin account.",
        "error-message"
      );

      return;
    }

    showDashboard();

    await initializeDashboard();

  } catch (error) {

    console.error(
      "INITIALIZATION ERROR:",
      error
    );

    showLogin();

    showLoginMessage(
      "Initialization Error: " +
      error.message,
      "error-message"
    );
  }
}

// ============================================
// DASHBOARD
// ============================================

async function initializeDashboard() {

  console.log(
    "INITIALIZING DASHBOARD..."
  );

  await loadStats();
  await loadCategories();
  await loadProducts();
  await loadOrders();

  console.log(
    "DASHBOARD INITIALIZED"
  );
}

// ============================================
// STATS
// ============================================

async function loadStats() {

  try {

    const {
      data: orders,
      error
    } =
      await supabaseClient
        .from("orders")
        .select(
          "id,total_amount,status"
        );

    if (error) {

      console.error(
        "STATS ERROR:",
        error
      );

      return;
    }

    const allOrders = orders || [];

    const pending =
      allOrders.filter(
        order =>
          order.status === "pending"
      ).length;

    const processing =
      allOrders.filter(
        order =>
          order.status === "processing"
      ).length;

    const delivered =
      allOrders.filter(
        order =>
          order.status === "delivered"
      ).length;

    const sales =
      allOrders.reduce(
        (sum, order) =>
          sum +
          Number(
            order.total_amount || 0
          ),
        0
      );

    if (totalOrders) {
      totalOrders.textContent =
        allOrders.length;
    }

    if (pendingOrders) {
      pendingOrders.textContent =
        pending;
    }

    if (processingOrders) {
      processingOrders.textContent =
        processing;
    }

    if (deliveredOrders) {
      deliveredOrders.textContent =
        delivered;
    }

    if (totalSales) {
      totalSales.textContent =
        "₦" +
        sales.toLocaleString(
          "en-NG"
        );
    }

  } catch (error) {

    console.error(
      "LOAD STATS ERROR:",
      error
    );
  }
}

// ============================================
// CATEGORIES
// ============================================

async function loadCategories() {

  if (!productCategory) return;

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("categories")
        .select("id,name")
        .order("name");

    if (error) {

      console.error(
        "CATEGORY ERROR:",
        error
      );

      return;
    }

    productCategory.innerHTML =
      '<option value="">Select Category</option>';

    (data || []).forEach(
      category => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          category.id;

        option.textContent =
          category.name;

        productCategory.appendChild(
          option
        );
      }
    );

  } catch (error) {

    console.error(
      "LOAD CATEGORY ERROR:",
      error
    );
  }
}

// ============================================
// PRODUCTS
// ============================================

async function loadProducts() {

  if (!productsTableBody) {
    return;
  }

  productsTableBody.innerHTML =
    '<tr><td colspan="7">Loading products...</td></tr>';

  try {

    const {
      data,
      error
    } =
      await supabaseClient
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
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {

      console.error(
        "PRODUCT ERROR:",
        error
      );

      productsTableBody.innerHTML =
        `<tr>
          <td colspan="7">
            Error: ${escapeHtml(
              error.message
            )}
          </td>
        </tr>`;

      return;
    }

    if (!data || data.length === 0) {

      productsTableBody.innerHTML =
        `<tr>
          <td colspan="7">
            No products found.
          </td>
        </tr>`;

      return;
    }

    productsTableBody.innerHTML = "";

    data.forEach(
      product => {

        const row =
          document.createElement(
            "tr"
          );

        const categoryName =
          product.categories &&
          product.categories.name
            ? product.categories.name
            : "No Category";

        let imageHtml =
          "No Image";

        if (product.image_url) {

          imageHtml = `
            <img
              src="${escapeHtml(
                product.image_url
              )}"
              alt="${escapeHtml(
                product.name
              )}"
              style="
                width:55px;
                height:55px;
                object-fit:cover;
                border-radius:8px;
              "
            >
          `;
        }

        const regularPrice =
          Number(
            product.price || 0
          );

        const discountPrice =
          product.discount_price !== null
            ? Number(
                product.discount
