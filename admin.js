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
// HELPER
// ============================================================

function el(id) {
  return document.getElementById(id);
}

function setValue(id, value) {
  const element = el(id);
  if (element) {
    element.value = value ?? "";
  }
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function makeSlug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


// ============================================================
// LOGIN
// ============================================================

function setupLogin() {
  const loginForm = el("loginForm");

  if (!loginForm) {
    console.error("loginForm not found");
    return;
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = el("adminEmail")?.value.trim();
    const password = el("adminPassword")?.value;

    if (!email || !password) {
      showLoginMessage("Please enter email and password.", "error");
      return;
    }

    const loginBtn = el("loginBtn");

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";
    }

    showLoginMessage("Checking login...", "info");

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      console.log("LOGIN RESULT:", data);
      console.log("LOGIN ERROR:", error);

      if (error) {
        console.error("Supabase login error:", error);

        showLoginMessage(
          error.message || "Login failed.",
          "error"
        );

        return;
      }

      if (!data.user) {
        showLoginMessage(
          "Login failed: user account not found.",
          "error"
        );

        return;
      }

      const isAdmin = await verifyAdmin(data.user.id);

      if (!isAdmin) {
        await supabaseClient.auth.signOut();

        showLoginMessage(
          "This account is not an admin account.",
          "error"
        );

        return;
      }

      showLoginMessage("Login successful.", "success");

      await showDashboard();

    } catch (error) {
      console.error("LOGIN EXCEPTION:", error);

      showLoginMessage(
        error.message || "An unexpected error occurred.",
        "error"
      );

    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      }
    }
  });
}


// ============================================================
// VERIFY ADMIN
// ============================================================

async function verifyAdmin(userId) {
  if (!userId) return false;

  try {
    const { data, error } = await supabaseClient
      .from("admin_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    console.log("ADMIN CHECK:", data);
    console.log("ADMIN CHECK ERROR:", error);

    if (error) {
      console.error("Admin verification error:", error);
      return false;
    }

    return !!data;

  } catch (error) {
    console.error("Admin verification exception:", error);
    return false;
  }
}


// ============================================================
// CHECK EXISTING SESSION
// ============================================================

async function checkExistingSession() {
  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      showLoginSection();
      return;
    }

    if (!session || !session.user) {
      showLoginSection();
      return;
    }

    const isAdmin = await verifyAdmin(session.user.id);

    if (!isAdmin) {
      await supabaseClient.auth.signOut();
      showLoginSection();
      return;
    }

    await showDashboard();

  } catch (error) {
    console.error("Session check error:", error);
    showLoginSection();
  }
}


// ============================================================
// LOGIN SECTION
// ============================================================

function showLoginSection() {
  const loginSection = el("loginSection");
  const dashboard = el("dashboard");

  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }
}


// ============================================================
// DASHBOARD
// ============================================================

async function showDashboard() {
  const loginSection = el("loginSection");
  const dashboard = el("dashboard");

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

function showLoginMessage(message, type = "info") {
  const box = el("loginMessage");

  if (!box) return;

  box.textContent = message;

  if (type === "error") {
    box.style.color = "#dc2626";
  } else if (type === "success") {
    box.style.color = "#16a34a";
  } else {
    box.style.color = "#2563eb";
  }
}


// ============================================================
// DASHBOARD BUTTONS
// ============================================================

function setupDashboardButtons() {

  // Logout
  const logoutBtn = el("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

      try {
        await supabaseClient.auth.signOut();

        showLoginSection();

        if (el("adminEmail")) {
          el("adminEmail").value = "";
        }

        if (el("adminPassword")) {
          el("adminPassword").value = "";
        }

        showLoginMessage(
          "You have been logged out.",
          "success"
        );

      } catch (error) {
        console.error("Logout error:", error);
      }
    });
  }


  // Add Product
  const addProductBtn = el("addProductBtn");

  if (addProductBtn) {
    addProductBtn.addEventListener("click", function () {
      openProductForm();
    });
  }


  // Refresh Orders
  const refreshOrdersBtn = el("refreshOrdersBtn");

  if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener("click", async function () {
      await loadOrders();
    });
  }


  // Close order modal
  const closeModalBtn = el("closeModalBtn");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", function () {
      closeOrderModal();
    });
  }


  // Close modal when clicking outside
  const orderModal = el("orderModal");

  if (orderModal) {
    orderModal.addEventListener("click", function (event) {
      if (event.target === orderModal) {
        closeOrderModal();
      }
    });
  }
}


// ============================================================
// DASHBOARD DATA
// ============================================================

async function loadDashboardData() {
  await loadCategories();
  await loadProducts();
  await loadOrders();
}


// ============================================================
// LOAD CATEGORIES
// ============================================================

async function loadCategories() {
  try {
    const { data, error } = await supabaseClient
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("Categories error:", error);
      return;
    }

    categoriesCache = data || [];

    const select = el("productCategory");

    if (!select) return;

    const currentValue = select.value;

    select.innerHTML =
      `<option value="">Select Category</option>`;

    categoriesCache.forEach(function (category) {

      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      select.appendChild(option);
    });

    if (currentValue) {
      select.value = currentValue;
    }

  } catch (error) {
    console.error("Load categories exception:", error);
  }
}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

  const tbody = el("productsTableBody");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;">
        Loading products...
      </td>
    </tr>
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
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products error:", error);

      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;color:red;">
            ${escapeHTML(error.message)}
          </td>
        </tr>
      `;

      return;
    }

    if (!data || data.length === 0) {

      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;">
            No products found.
          </td>
        </tr>
      `;

      return;
    }


    tbody.innerHTML = data.map(function (product) {

      const categoryName =
        product.categories?.name || "No category";

      const image =
        product.image_url ||
        "https://placehold.co/80x80?text=MAYA";

      const regularPrice = Number(product.price || 0);

      const discountPrice =
        product.discount_price !== null &&
        product.discount_price !== undefined
          ? Number(product.discount_price)
          : null;

      let priceHTML = "";

      if (
        discountPrice !== null &&
        discountPrice > 0 &&
        discountPrice < regularPrice
      ) {

        priceHTML = `
          <strong>${formatMoney(discountPrice)}</strong>
          <br>
          <small style="text-decoration:line-through;color:#777;">
            ${formatMoney(regularPrice)}
          </small>
        `;

      } else {

        priceHTML = `
          <strong>${formatMoney(regularPrice)}</strong>
        `;
      }


      const statusHTML = product.is_active
        ? `<span style="color:green;font-weight:bold;">Active</span>`
        : `<span style="color:red;font-weight:bold;">Inactive</span>`;


      return `
        <tr>

          <td>
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
              style="
                width:60px;
                height:60px;
                object-fit:cover;
                border-radius:8px;
              "
              onerror="this.src='https://placehold.co/80x80?text=MAYA';"
            >
          </td>

          <td>
            <strong>${escapeHTML(product.name)}</strong>
          </td>

          <td>
            ${escapeHTML(categoryName)}
          </td>

          <td>
            ${priceHTML}
          </td>

          <td>
            ${Number(product.stock || 0)}
          </td>

          <td>
            ${statusHTML}
          </td>

          <td>

            <button
              type="button"
              onclick="editProduct(${product.id})"
              style="margin:2px;"
            >
              Edit
            </button>

            <button
              type="button"
              onclick="toggleProductStatus(${product.id}, ${product.is_active})"
              style="margin:2px;"
            >
              ${product.is_active ? "Disable" : "Enable"}
            </button>

            <button
              type="button"
              onclick="deleteProduct(${product.id})"
              style="margin:2px;color:red;"
            >
              Delete
            </button>

          </td>

        </tr>
      `;

    }).join("");


  } catch (error) {

    console.error("Load products exception:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:red;">
          Failed to load products.
        </td>
      </tr>
    `;
  }
}


// ============================================================
// PRODUCT FORM
// ============================================================

function setupProductForm() {

  const form = el("productForm");

  if (!form) {
    console.warn("productForm not found");
    return;
  }

  form.addEventListener("submit", async function (event) {

    event.preventDefault();

    await saveProduct();
  });


  const cancelBtn = el("cancelProductBtn");

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

  const box = el("productFormBox");

  if (box) {
    box.style.display = "block";
  }


  if (!product) {

    editingProductId = null;

    setValue("productId", "");
    setValue("productName", "");
    setValue("productCategory", "");
    setValue("productPrice", "");
    setValue("productDiscountPrice", "");
    setValue("productStock", "0");
    setValue("productImage", "");
    setValue("productSizes", "");
    setValue("productColors", "");
    setValue("productDescription", "");

    const saveBtn = el("saveProductBtn");

    if (saveBtn) {
      saveBtn.textContent = "Save Product";
    }

    return;
  }


  editingProductId = product.id;

  setValue("productId", product.id);
  setValue("productName", product.name);
  setValue("productCategory", product.category_id);
  setValue("productPrice", product.price);
  setValue(
    "productDiscountPrice",
    product.discount_price ?? ""
  );
  setValue("productStock", product.stock);
  setValue("productImage", product.image_url ?? "");
  setValue(
    "productSizes",
    Array.isArray(product.sizes)
      ? product.sizes.join(", ")
      : product.sizes || ""
  );
  setValue(
    "productColors",
    Array.isArray(product.colors)
      ? product.colors.join(", ")
      : product.colors || ""
  );
  setValue(
    "productDescription",
    product.description ?? ""
  );


  const saveBtn = el("saveProductBtn");

  if (saveBtn) {
    saveBtn.textContent = "Update Product";
  }
}


// ============================================================
// CLOSE PRODUCT FORM
// ============================================================

function closeProductForm() {

  const box = el("productFormBox");

  if (box) {
    box.style.display = "none";
  }

  editingProductId = null;

  const form = el("productForm");

  if (form) {
    form.reset();
  }

  setValue("productId", "");

  const saveBtn = el("saveProductBtn");

  if (saveBtn) {
    saveBtn.textContent = "Save Product";
  }
}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct() {

  const name = el("productName")?.value.trim();
  const categoryId = el("productCategory")?.value;
  const price = el("productPrice")?.value;
  const discountPrice = el("productDiscountPrice")?.value;
  const stock = el("productStock")?.value;
  const imageUrl = el("productImage")?.value.trim();
  const sizesText = el("productSizes")?.value || "";
  const colorsText = el("productColors")?.value || "";
  const description = el("productDescription")?.value.trim();


  if (!name) {
    showProductMessage("Please enter product name.", "error");
    return;
  }

  if (!categoryId) {
    showProductMessage("Please select a category.", "error");
    return;
  }

  if (!price || Number(price) < 0) {
    showProductMessage("Please enter a valid price.", "error");
    return;
  }


  const saveBtn = el("saveProductBtn");

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = editingProductId
      ? "Updating..."
      : "Saving...";
  }


  try {

    const sizes = sizesText
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

    const colors = colorsText
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);


    let slug = makeSlug(name);

    // Editing existing product
    if (editingProductId) {

      const { data: oldProduct, error: oldProductError } =
        await supabaseClient
          .from("products")
          .select("slug")
          .eq("id", editingProductId)
          .maybeSingle();

      if (oldProductError) {
        console.error(oldProductError);
      }

      if (
        oldProduct &&
        oldProduct.slug &&
        makeSlug(name) === makeSlug(
          oldProduct.slug
            .replace(/-\d+$/, "")
        )
      ) {
        slug = oldProduct.slug;
      }

    }


    // Check slug
    const { data: slugExists, error: slugError } =
      await supabaseClient
        .from("products")
        .select("id")
        .eq("slug", slug)
        .neq(
          "id",
          editingProductId || -1
        )
        .maybeSingle();


    if (slugError) {
      console.error("Slug check error:", slugError);
    }


    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }


    const productData = {

      name: name,

      slug: slug,

      description:
        description || null,

      price:
        Number(price),

      discount_price:
        discountPrice !== ""
          ? Number(discountPrice)
          : null,

      category_id:
        Number(categoryId),

      sizes:
        sizes,

      colors:
        colors,

      stock:
        Number(stock || 0),

      image_url:
        imageUrl || null,

      is_active:
        true,

      updated_at:
        new Date().toISOString()
    };


    if (editingProductId) {

      const { error } =
        await supabaseClient
          .from("products")
          .update(productData)
          .eq("id", editingProductId);

      if (error) {
        throw error;
      }

      showProductMessage(
        "Product updated successfully.",
        "success"
      );

    } else {

      productData.created_at =
        new Date().toISOString();

      const { error } =
        await supabaseClient
          .from("products")
          .insert(productData);

      if (error) {
        throw error;
      }

      showProductMessage(
        "Product added successfully.",
        "success"
      );
    }


    closeProductForm();

    await loadProducts();

    await loadDashboardStats();


  } catch (error) {

    console.error("Save product error:", error);

    showProductMessage(
      error.message ||
      "Could not save product.",
      "error"
    );

  } finally {

    if (saveBtn) {
      saveBtn.disabled = false;

      saveBtn.textContent =
        editingProductId
          ? "Update Product"
          : "Save Product";
    }
  }
}


// ============================================================
// PRODUCT MESSAGE
// ============================================================

function showProductMessage(message, type = "info") {

  const box = el("productMessage");

  if (!box) return;

  box.textContent = message;

  if (type === "error") {
    box.style.color = "#dc2626";
  } else if (type === "success") {
    box.style.color = "#16a34a";
  } else {
    box.style.color = "#2563eb";
  }
}


// ============================================================
// EDIT PRODUCT
// ============================================================

async function editProduct(productId) {

  try {

    const { data, error } =
      await supabaseClient
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      alert("Product not found.");
      return;
    }

    openProductForm(data);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error("Edit product error:", error);

    alert(
      error.message ||
      "Could not load product."
    );
  }
}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(productId) {

  const confirmed = confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmed) return;


  try {

    const { error } =
      await supabaseClient
        .from("products")
        .delete()
        .eq("id", productId);

    if (error) {
      throw error;
    }

    alert("Product deleted successfully.");

    await loadProducts();

    await loadDashboardStats();

  } catch (error) {

    console.error("Delete product error:", error);

    alert(
      error.message ||
      "Could not delete product."
    );
  }
}


// ============================================================
// TOGGLE PRODUCT STATUS
// ============================================================

async function toggleProductStatus(productId, currentStatus) {

  try {

    const { error } =
      await supabaseClient
        .from("products")
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", productId);

    if (error) {
      throw error;
    }

    await loadProducts();

  } catch (error) {

    console.error(
      "Toggle product status error:",
      error
    );

    alert(
      error.message ||
      "Could not change product status."
    );
  }
}


// ============================================================
// LOAD ORDERS
// ============================================================

async function loadOrders() {

  const tbody = el("ordersTableBody");

  if (!tbody) return;


  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align:center;">
        Loading orders...
      </td>
    </tr>
  `;


  try {

    const { data, error } =
      await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false
        });


    if (error) {
      console.error("Orders error:", error);

      tbody.innerHTML = `
        <tr>
          <td colspan="8"
              style="text-align:center;color:red;">
            ${escapeHTML(error.message)}
          </td>
        </tr>
      `;

      return;
    }


    if (!data || data.length === 0) {

      tbody.innerHTML = `
        <tr>
          <td colspan="8"
              style="text-align:center;">
            No orders yet.
          </td>
        </tr>
      `;

      await loadDashboardStats();

      return;
    }


    tbody.innerHTML = data.map(function (order) {

      return `
        <tr>

          <td>
            #${escapeHTML(order.id)}
          </td>

          <td>
            ${escapeHTML(order.customer_name)}
          </td>

          <td>
            ${escapeHTML(order.phone)}
          </td>

          <td>
            ${formatMoney(order.total_amount)}
          </td>

          <td>
            ${escapeHTML(order.payment_status)}
          </td>

          <td>
            ${escapeHTML(order.status)}
          </td>

          <td>
            ${formatDate(order.created_at)}
          </td>

          <td>

            <button
              type="button"
              onclick="viewOrder(${order.id})"
            >
              View
            </button>

            <button
              type="button"
              onclick="updateOrderStatus(${order.id}, 'processing')"
            >
              Processing
            </button>

            <button
              type="button"
              onclick="updateOrderStatus(${order.id}, 'delivered')"
            >
              Delivered
            </button>

          </td>

        </tr>
      `;

    }).join("");


    await loadDashboardStats();


  } catch (error) {

    console.error("Load orders exception:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="8"
            style="text-align:center;color:red;">
          Failed to load orders.
        </td>
      </tr>
    `;
  }
}


// ============================================================
// DASHBOARD STATS
// ============================================================

async function loadDashboardStats() {

  try {

    const { data: orders, error } =
      await supabaseClient
        .from("orders")
        .select(
          "id,total_amount,status,payment_status"
        );


    if (error) {
      console.error(
        "Dashboard stats error:",
        error
      );

      return;
    }


    const allOrders = orders || [];


    const pending =
      allOrders.filter(
        order => order.status === "pending"
      ).length;


    const processing =
      allOrders.filter(
        order => order.status === "processing"
      ).length;


    const delivered =
      allOrders.filter(
        order => order.status === "delivered"
      ).length;


    const totalSales =
      allOrders
        .filter(
          order =>
            order.payment_status === "paid"
        )
        .reduce(
          (sum, order) =>
            sum + Number(order.total_amount || 0),
          0
        );


    if (el("totalOrders")) {
      el("totalOrders").textContent =
        allOrders.length;
    }

    if (el("pendingOrders")) {
      el("pendingOrders").textContent =
        pending;
    }

    if (el("processingOrders")) {
      el("processingOrders").textContent =
        processing;
    }

    if (el("deliveredOrders")) {
      el("deliveredOrders").textContent =
        delivered;
    }

    if (el("totalSales")) {
      el("totalSales").textContent =
        formatMoney(totalSales);
    }


  } catch (error) {

    console.error(
      "Dashboard stats exception:",
      error
    );
  }
}


// ============================================================
// VIEW ORDER
// ============================================================

async function viewOrder(orderId) {

  try {

    const { data: order, error } =
      await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();


    if (error) {
      throw error;
    }

    if (!order) {
      alert("Order not found.");
      return;
    }


    const {
      data: items,
      error: itemsError
    } =
      await supabaseClient
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);


    if (itemsError) {
      throw itemsError;
    }


    const details = el("orderDetails");

    if (!details) return;


    details.innerHTML = `

      <div style="line-height:1.8;">

        <h3>
          Order #${escapeHTML(order.id)}
        </h3>

        <p>
          <strong>Customer:</strong>
          ${escapeHTML(order.customer_name)}
        </p>

        <p>
          <strong>Phone:</strong>
          ${escapeHTML(order.phone)}
        </p>

        <p>
          <strong>WhatsApp:</strong>
          ${escapeHTML(order.whatsapp || "-")}
        </p>

        <p>
          <strong>Email:</strong>
          ${escapeHTML(order.email || "-")}
        </p>

        <p>
          <strong>Address:</strong>
          ${escapeHTML(order.address)}
        </p>

        <p>
          <strong>City:</strong>
          ${escapeHTML(order.city || "-")}
        </p>

        <p>
          <strong>State:</strong>
          ${escapeHTML(order.state || "-")}
        </p>

        <p>
          <strong>Notes:</strong>
          ${escapeHTML(order.notes || "-")}
        </p>

        <p>
          <strong>Status:</strong>
          ${escapeHTML(order.status)}
        </p>

        <p>
          <strong>Payment:</strong>
          ${escapeHTML(order.payment_status)}
        </p>

        <p>
          <strong>Date:</strong>
          ${formatDate(order.created_at)}
        </p>


        <hr>


        <h4>Products</h4>

        ${
          items && items.length
            ? `
              <div>
                ${items.map(function (item) {

                  return `
                    <div
                      style="
                        padding:10px 0;
                        border-bottom:1px solid #ddd;
                      "
                    >

                      <strong>
                        ${escapeHTML(
                          item.product_name
                        )}
                      </strong>

                      <br>

                      Quantity:
                      ${Number(item.quantity)}

                      <br>

                      Unit Price:
                      ${formatMoney(
                        item.unit_price
                      )}

                      <br>

                      Subtotal:
                      ${formatMoney(
                        item.subtotal
                      )}

                    </div>
                  `;

                }).join("")}
              </div>
            `
            : "<p>No items found.</p>"
        }


        <hr>


        <h3>
          Total:
          ${formatMoney(order.total_amount)}
        </h3>

      </div>
    `;


    openOrderModal();

  } catch (error) {

    console.error(
      "View order error:",
      error
    );

    alert(
      error.message ||
      "Could not load order."
    );
  }
}


// ============================================================
// ORDER MODAL
// ============================================================

function openOrderModal() {

  const modal = el("orderModal");

  if (modal) {
    modal.style.display = "flex";
  }
}


function closeOrderModal() {

  const modal = el("orderModal");

  if (modal) {
    modal.style.display = "none";
  }
}


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

async function updateOrderStatus(orderId, status) {

  try {

    const { error } =
      await supabaseClient
        .from("orders")
        .update({
          status: status
        })
        .eq("id", orderId);


    if (error) {
      throw error;
    }


    alert(
      `Order status changed to ${status}.`
    );


    await loadOrders();

  } catch (error) {

    console.error(
      "Update order status error:",
      error
    );

    alert(
      error.message ||
      "Could not update order status."
    );
  }
}


// ============================================================
// AUTH STATE LISTENER
// ============================================================

supabaseClient.auth.onAuthStateChange(
  async function (event, session) {

    console.log(
      "AUTH EVENT:",
      event
    );

    if (event === "SIGNED_OUT") {
      showLoginSection();
    }

  }
);


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.toggleProductStatus = toggleProductStatus;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.openProductForm = openProductForm;
window.closeProductForm = closeProductForm;
window.closeOrderModal = closeOrderModal;
