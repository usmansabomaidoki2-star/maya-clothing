/* =====================================================
   MAYA CLOTHING - ADMIN DASHBOARD
===================================================== */

const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================================
   ELEMENTS
===================================================== */

const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const productsTableBody =
  document.getElementById("productsTableBody");

const ordersTableBody =
  document.getElementById("ordersTableBody");

const productMessage =
  document.getElementById("productMessage");

const ordersMessage =
  document.getElementById("ordersMessage");

const productForm =
  document.getElementById("productForm");

const productFormBox =
  document.getElementById("productFormBox");

const addProductBtn =
  document.getElementById("addProductBtn");

const cancelProductBtn =
  document.getElementById("cancelProductBtn");

const productCategory =
  document.getElementById("productCategory");

const saveProductBtn =
  document.getElementById("saveProductBtn");

const refreshOrdersBtn =
  document.getElementById("refreshOrdersBtn");

const orderModal =
  document.getElementById("orderModal");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const orderDetails =
  document.getElementById("orderDetails");


/* =====================================================
   HELPERS
===================================================== */

function showMessage(element, message, type = "error") {
  if (!element) return;

  element.textContent = message;

  element.className =
    type === "success"
      ? "message success-message"
      : "message error-message";

  element.style.display = "block";
}


function hideMessage(element) {
  if (!element) return;
  element.style.display = "none";
}


function formatMoney(amount) {
  return "₦" +
    Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
}


function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function createSlug(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
    +
    "-" +
    Date.now()
  );
}


/* =====================================================
   PAGE DISPLAY
===================================================== */

function showLogin() {
  loginSection.style.display = "block";
  dashboard.style.display = "none";
}


function showDashboard() {
  loginSection.style.display = "none";
  dashboard.style.display = "block";
}


/* =====================================================
   ADMIN CHECK
===================================================== */

async function verifyAdmin(user) {

  if (!user) {
    return {
      ok: false,
      message: "No logged-in user."
    };
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Admin verification error:", error);

    return {
      ok: false,
      message: "Admin verification failed: " +
        error.message
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "This account is not authorized as an admin."
    };
  }

  return {
    ok: true
  };
}


/* =====================================================
   INITIAL SESSION CHECK
===================================================== */

async function initializeAdmin() {

  try {

    showLogin();

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error(error);

      showMessage(
        loginMessage,
        "Unable to check login session: " +
        error.message
      );

      return;
    }

    const session = data?.session;

    if (!session?.user) {
      return;
    }

    const result =
      await verifyAdmin(session.user);

    if (!result.ok) {

      await supabaseClient.auth.signOut();

      showLogin();

      showMessage(
        loginMessage,
        result.message
      );

      return;
    }

    showDashboard();

    await loadProductCategories();
    await loadAdminProducts();
    await loadOrders();

  } catch (error) {

    console.error(
      "Initialization error:",
      error
    );

    showLogin();

    showMessage(
      loginMessage,
      "Something went wrong while loading the admin dashboard."
    );
  }
}


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    hideMessage(loginMessage);

    const email =
      document.getElementById("adminEmail")
        .value
        .trim();

    const password =
      document.getElementById("adminPassword")
        .value;

    if (!email || !password) {

      showMessage(
        loginMessage,
        "Please enter email and password."
      );

      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {

      const {
        data,
        error
      } = await supabaseClient.auth
        .signInWithPassword({
          email,
          password
        });

      if (error) {

        console.error(
          "Supabase login error:",
          error
        );

        showMessage(
          loginMessage,
          error.message
        );

        return;
      }

      if (!data?.user) {

        showMessage(
          loginMessage,
          "Login failed. No user session was returned."
        );

        return;
      }

      console.log(
        "Logged in user:",
        data.user.id,
        data.user.email
      );

      const adminResult =
        await verifyAdmin(data.user);

      if (!adminResult.ok) {

        console.error(
          "Admin verification failed:",
          adminResult.message
        );

        await supabaseClient.auth.signOut();

        showLogin();

        showMessage(
          loginMessage,
          adminResult.message
        );

        return;
      }

      /* ADMIN VERIFIED */

      showDashboard();

      loginForm.reset();

      await loadProductCategories();
      await loadAdminProducts();
      await loadOrders();

    } catch (error) {

      console.error(
        "Login exception:",
        error
      );

      showMessage(
        loginMessage,
        error.message ||
        "Something went wrong during login."
      );

    } finally {

      loginBtn.disabled = false;
      loginBtn.textContent = "Login";

    }
  }
);


/* =====================================================
   LOGOUT
===================================================== */

logoutBtn.addEventListener(
  "click",
  async function() {

    logoutBtn.disabled = true;
    logoutBtn.textContent = "Logging out...";

    try {

      await supabaseClient.auth.signOut();

      showLogin();

      loginForm.reset();

      hideMessage(loginMessage);

    } catch (error) {

      console.error(error);

      showMessage(
        loginMessage,
        "Could not logout: " +
        error.message
      );

    } finally {

      logoutBtn.disabled = false;
      logoutBtn.textContent = "Logout";

    }
  }
);


/* =====================================================
   CATEGORIES
===================================================== */

async function loadProductCategories() {

  const {
    data,
    error
  } = await supabaseClient
    .from("categories")
    .select("id,name")
    .order("name");

  if (error) {

    console.error(
      "Category error:",
      error
    );

    return;
  }

  productCategory.innerHTML =
    `<option value="">Select Category</option>`;

  (data || []).forEach(category => {

    const option =
      document.createElement("option");

    option.value = category.id;
    option.textContent = category.name;

    productCategory.appendChild(option);

  });
}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadAdminProducts() {

  productsTableBody.innerHTML = `
    <tr>
      <td colspan="8">
        Loading products...
      </td>
    </tr>
  `;

  const {
    data: products,
    error
  } = await supabaseClient
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
      updated_at,
      categories (
        name
      )
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "Products error:",
      error
    );

    productsTableBody.innerHTML = `
      <tr>
        <td colspan="8">
          Could not load products:
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;

    return;
  }

  displayAdminProducts(
    products || []
  );
}


/* =====================================================
   DISPLAY PRODUCTS
===================================================== */

function displayAdminProducts(products) {

  productsTableBody.innerHTML = "";

  if (!products.length) {

    productsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No products found.
        </td>
      </tr>
    `;

    return;
  }

  products.forEach(product => {

    const row =
      document.createElement("tr");

    const image =
      product.image_url
        ? `
          <img
            src="${escapeHtml(product.image_url)}"
            class="product-thumb"
            alt="${escapeHtml(product.name)}"
          >
        `
        : `
          <div
            class="product-thumb"
            style="
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:10px;
            "
          >
            No Image
          </div>
        `;

    row.innerHTML = `

      <td>
        ${image}
      </td>

      <td>
        <strong>
          ${escapeHtml(product.name)}
        </strong>
      </td>

      <td>
        ${escapeHtml(
          product.categories?.name || "-"
        )}
      </td>

      <td>
        ${formatMoney(product.price)}
        ${
          product.discount_price !== null
            ? `
              <br>
              <small>
                Sale:
                ${formatMoney(product.discount_price)}
              </small>
            `
            : ""
        }
      </td>

      <td>
        ${product.stock}
      </td>

      <td>
        ${
          product.is_active
            ? `<span class="status-active">Active</span>`
            : `<span class="status-inactive">Inactive</span>`
        }
      </td>

      <td>

        <div class="table-actions">

          <button
            class="admin-btn primary-btn small-btn"
            onclick="editProduct(${product.id})"
          >
            Edit
          </button>

          <button
            class="admin-btn secondary-btn small-btn"
            onclick="toggleProduct(
              ${product.id},
              ${product.is_active}
            )"
          >
            ${
              product.is_active
                ? "Deactivate"
                : "Activate"
            }
          </button>

        </div>

      </td>

    `;

    productsTableBody.appendChild(row);

  });
}


/* =====================================================
   ADD PRODUCT
===================================================== */

addProductBtn.addEventListener(
  "click",
  async function() {

    productForm.reset();

    document.getElementById(
      "productId"
    ).value = "";

    saveProductBtn.textContent =
      "Save Product";

    hideMessage(productMessage);

    await loadProductCategories();

    productFormBox.style.display =
      "block";

    productFormBox.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
);


/* =====================================================
   CANCEL PRODUCT
===================================================== */

cancelProductBtn.addEventListener(
  "click",
  function() {

    productForm.reset();

    document.getElementById(
      "productId"
    ).value = "";

    saveProductBtn.textContent =
      "Save Product";

    productFormBox.style.display =
      "none";

    hideMessage(productMessage);

  }
);


/* =====================================================
   SAVE PRODUCT
===================================================== */

productForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    hideMessage(productMessage);

    const id =
      document.getElementById(
        "productId"
      ).value.trim();

    const name =
      document.getElementById(
        "productName"
      ).value.trim();

    const description =
      document.getElementById(
        "productDescription"
      ).value.trim();

    const categoryId =
      document.getElementById(
        "productCategory"
      ).value;

    const price =
      Number(
        document.getElementById(
          "productPrice"
        ).value
      );

    const discountValue =
      document.getElementById(
        "productDiscountPrice"
      ).value;

    const stock =
      Number(
        document.getElementById(
          "productStock"
        ).value
      );

    const sizesText =
      document.getElementById(
        "productSizes"
      ).value.trim();

    const colorsText =
      document.getElementById(
        "productColors"
      ).value.trim();

    const imageUrl =
      document.getElementById(
        "productImage"
      ).value.trim();

    if (!name) {
      showMessage(
        productMessage,
        "Product name is required."
      );
      return;
    }

    if (!categoryId) {
      showMessage(
        productMessage,
        "Please select a category."
      );
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      showMessage(
        productMessage,
        "Please enter a valid price."
      );
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      showMessage(
        productMessage,
        "Stock must be a valid whole number."
      );
      return;
    }

    let discountPrice =
      discountValue === ""
        ? null
        : Number(discountValue);

    if (
      discountPrice !== null &&
      (
        !Number.isFinite(discountPrice) ||
        discountPrice < 0
      )
    ) {
      showMessage(
        productMessage,
        "Please enter a valid discount price."
      );
      return;
    }

    if (
      discountPrice !== null &&
      discountPrice > price
    ) {
      showMessage(
        productMessage,
        "Discount price cannot be higher than regular price."
      );
      return;
    }

    const sizes =
      sizesText
        ? sizesText
            .split(",")
            .map(x => x.trim())
            .filter(Boolean)
        : [];

    const colors =
      colorsText
        ? colorsText
            .split(",")
            .map(x => x.trim())
            .filter(Boolean)
        : [];

    const productData = {

      name,

      description:
        description || null,

      price,

      discount_price:
        discountPrice,

      category_id:
        Number(categoryId),

      sizes,

      colors,

      stock,

      image_url:
        imageUrl || null,

      updated_at:
        new Date().toISOString()

    };

    if (!id) {
      productData.slug =
        createSlug(name);
    }

    saveProductBtn.disabled = true;

    saveProductBtn.textContent =
      id
        ? "Updating..."
        : "Saving...";

    let result;

    if (id) {

      result =
        await supabaseClient
          .from("products")
          .update(productData)
          .eq(
            "id",
            Number(id)
          );

    } else {

      result =
        await supabaseClient
          .from("products")
          .insert(productData);

    }

    if (result.error) {

      console.error(
        "Save product error:",
        result.error
      );

      showMessage(
        productMessage,
        "Could not save product: " +
        result.error.message
      );

      return;
    }

   
