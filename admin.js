// ============================================================
// MAYA CLOTHING - COMPLETE ADMIN PANEL
// Login + Products + Edit + Delete + Orders
// ============================================================

const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

let editingProductId = null;
let categoriesCache = [];


// ============================================================
// START
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("MAYA ADMIN JS LOADED");

  setupLogin();
  setupDashboardButtons();
  setupProductForm();
  setupOrderButtons();

  await checkExistingSession();

});


// ============================================================
// HELPERS
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

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatMoney(amount) {

  return "₦" +
    Number(amount || 0)
      .toLocaleString("en-NG");

}


function formatDate(date) {

  if (!date) return "-";

  return new Date(date).toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

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

  const form = el("loginForm");

  if (!form) {
    console.error("loginForm not found");
    return;
  }


  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const email =
        el("adminEmail")?.value.trim();

      const password =
        el("adminPassword")?.value;


      if (!email || !password) {

        showLoginMessage(
          "Please enter email and password.",
          "error"
        );

        return;
      }


      const button = el("loginBtn");

      if (button) {
        button.disabled = true;
        button.textContent = "Logging in...";
      }


      showLoginMessage(
        "Checking login...",
        "info"
      );


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });


        console.log(
          "LOGIN DATA:",
          data
        );

        console.log(
          "LOGIN ERROR:",
          error
        );


        if (error) {

          showLoginMessage(
            error.message,
            "error"
          );

          return;
        }


        if (!data.user) {

          showLoginMessage(
            "Login failed.",
            "error"
          );

          return;
        }


        const isAdmin =
          await verifyAdmin(
            data.user.id
          );


        if (!isAdmin) {

          await supabaseClient.auth.signOut();

          showLoginMessage(
            "This account is not an admin account.",
            "error"
          );

          return;
        }


        showLoginMessage(
          "Login successful.",
          "success"
        );


        await showDashboard();

      }

      catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );

        showLoginMessage(
          error.message ||
          "Login failed.",
          "error"
        );

      }

      finally {

        if (button) {

          button.disabled = false;

          button.textContent =
            "Login";

        }

      }

    }
  );

}


// ============================================================
// VERIFY ADMIN
// ============================================================

async function verifyAdmin(userId) {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("admin_users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();


    if (error) {

      console.error(
        "ADMIN CHECK ERROR:",
        error
      );

      return false;
    }


    return !!data;

  }

  catch (error) {

    console.error(
      "ADMIN CHECK EXCEPTION:",
      error
    );

    return false;
  }

}


// ============================================================
// EXISTING SESSION
// ============================================================

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      showLoginSection();

      return;
    }


    const session =
      data?.session;


    if (!session?.user) {

      showLoginSection();

      return;
    }


    const isAdmin =
      await verifyAdmin(
        session.user.id
      );


    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      showLoginSection();

      return;
    }


    await showDashboard();

  }

  catch (error) {

    console.error(
      "SESSION EXCEPTION:",
      error
    );

    showLoginSection();
  }

}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLoginSection() {

  const login =
    el("loginSection");

  const dashboard =
    el("dashboard");


  if (login) {
    login.style.display = "flex";
  }


  if (dashboard) {
    dashboard.style.display = "none";
  }

}


// ============================================================
// SHOW DASHBOARD
// ============================================================

async function showDashboard() {

  const login =
    el("loginSection");

  const dashboard =
    el("dashboard");


  if (login) {
    login.style.display = "none";
  }


  if (dashboard) {
    dashboard.style.display = "block";
  }


  await loadDashboardData();

}


// ============================================================
// LOGIN MESSAGE
// ============================================================

function showLoginMessage(
  message,
  type = "info"
) {

  const box =
    el("loginMessage");


  if (!box) return;


  box.textContent =
    message;


  if (type === "error") {

    box.style.color =
      "#dc2626";

  }

  else if (type === "success") {

    box.style.color =
      "#16a34a";

  }

  else {

    box.style.color =
      "#2563eb";

  }

}


// ============================================================
// DASHBOARD BUTTONS
// ============================================================

function setupDashboardButtons() {

  const logout =
    el("logoutBtn");


  if (logout) {

    logout.addEventListener(
      "click",
      async () => {

        await supabaseClient.auth.signOut();

        showLoginSection();

      }
    );

  }


  const addProduct =
    el("addProductBtn");


  if (addProduct) {

    addProduct.addEventListener(
      "click",
      () => {

        openProductForm();

      }
    );

  }


  const refresh =
    el("refreshOrdersBtn");


  if (refresh) {

    refresh.addEventListener(
      "click",
      async () => {

        await loadOrders();

      }
    );

  }


  const closeModal =
    el("closeModalBtn");


  if (closeModal) {

    closeModal.addEventListener(
      "click",
      closeOrderModal
    );

  }

}


// ============================================================
// ORDER BUTTON SETUP
// ============================================================

function setupOrderButtons() {

  const modal =
    el("orderModal");


  if (!modal) return;


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeOrderModal();

      }

    }
  );

}


// ============================================================
// DASHBOARD DATA
// ============================================================

async function loadDashboardData() {

  await loadCategories();

  await loadProducts();

  await loadOrders();

  await loadDashboardStats();

}


// ============================================================
// CATEGORIES
// ============================================================

async function loadCategories() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("categories")
        .select(
          "id,name,slug"
        )
        .order(
          "name",
          { ascending: true }
        );


    if (error) {

      console.error(
        "CATEGORY ERROR:",
        error
      );

      return;
    }


    categoriesCache =
      data || [];


    const select =
      el("productCategory");


    if (!select) return;


    select.innerHTML =
      `<option value="">
        Select Category
      </option>`;


    categoriesCache.forEach(
      category => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          category.id;

        option.textContent =
          category.name;

        select.appendChild(
          option
        );

      }
    );

  }

  catch (error) {

    console.error(
      "CATEGORY EXCEPTION:",
      error
    );

  }

}


// ============================================================
// PRODUCTS
// ============================================================

async function loadProducts() {

  const tbody =
    el("productsTableBody");


  if (!tbody) return;


  tbody.innerHTML = `
    <tr>
      <td colspan="7"
          style="text-align:center;">
        Loading products...
      </td>
    </tr>
  `;


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
          updated_at,
          categories (
            id,
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


      tbody.innerHTML = `
        <tr>
          <td colspan="7"
              style="
                color:red;
                text-align:center;
              ">
            ${escapeHTML(
              error.message
            )}
          </td>
        </tr>
      `;

      return;
    }


    if (!data?.length) {

      tbody.innerHTML = `
        <tr>
          <td colspan="7"
              style="text-align:center;">
            No products found.
          </td>
        </tr>
      `;

      return;
    }


    tbody.innerHTML =
      data.map(product => {


        const image =
          product.image_url ||
          "https://placehold.co/80x80?text=MAYA";


        const category =
          product.categories?.name ||
          "No Category";


        const price =
          Number(
            product.price || 0
          );


        const discount =
          product.discount_price !== null
            ? Number(
                product.discount_price
              )
            : null;


        let priceHTML;


        if (
          discount &&
          discount > 0 &&
          discount < price
        ) {

          priceHTML = `
            <strong>
              ${formatMoney(
                discount
              )}
            </strong>

            <br>

            <small
              style="
                text-decoration:
                  line-through;
                color:#777;
              "
            >
              ${formatMoney(price)}
            </small>
          `;

        }

        else {

          priceHTML =
            formatMoney(price);

        }


        const status =
          product.is_active
            ? `
              <span
                style="
                  color:green;
                  font-weight:bold;
                "
              >
                Active
              </span>
            `
            : `
              <span
                style="
                  color:red;
                  font-weight:bold;
                "
              >
                Inactive
              </span>
            `;


        return `

          <tr>

            <td>

              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(
                  product.name
                )}"
                style="
                  width:60px;
                  height:60px;
                  object-fit:cover;
                  border-radius:8px;
                "
                onerror="
                  this.src=
                  'https://placehold.co/80x80?text=MAYA';
                "
              >

            </td>


            <td>

              <strong>
                ${escapeHTML(
                  product.name
                )}
              </strong>

            </td>


            <td>
              ${escapeHTML(category)}
            </td>


            <td>
              ${priceHTML}
            </td>


            <td>
              ${Number(
                product.stock || 0
              )}
            </td>


            <td>
              ${status}
            </td>


            <td
              style="
                white-space:nowrap;
              "
            >

              <button
                type="button"
                class="btn btn-primary"
                onclick="
                  editProduct(
                    ${product.id}
                  )
                "
              >
                ✏️ Edit
              </button>


              <button
                type="button"
                class="btn btn-warning"
                onclick="
                  toggleProductStatus(
                    ${product.id},
                    ${product.is_active}
                  )
                "
              >
                ${
                  product.is_active
                    ? "Disable"
                    : "Enable"
                }
              </button>


              <button
                type="button"
                class="btn btn-danger"
                onclick="
                  deleteProduct(
                    ${product.id}
                  )
                "
              >
                🗑️ Delete
              </button>

            </td>

          </tr>

        `;

      }).join("");


  }

  catch (error) {

    console.error(
      "LOAD PRODUCTS ERROR:",
      error
    );


    tbody.innerHTML = `
      <tr>
        <td colspan="7"
            style="
              color:red;
              text-align:center;
            ">
          ${escapeHTML(
            error.message
          )}
        </td>
      </tr>
    `;

  }

}


// ============================================================
// PRODUCT FORM SETUP
// ============================================================

function setupProductForm() {

  const form =
    el("productForm");


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await saveProduct();

    }
  );


  const cancel =
    el("cancelProductBtn");


  if (cancel) {

    cancel.addEventListener(
      "click",
      closeProductForm
    );

  }

}


// ============================================================
// OPEN PRODUCT FORM
// ============================================================

function openProductForm(
  product = null
) {

  const box =
    el("productFormBox");


  if (box) {
    box.style.display =
      "block";
  }


  if (!product) {

    editingProductId =
      null;


    setValue(
      "productId",
      ""
    );

    setValue(
      "productName",
      ""
    );

    setValue(
      "productCategory",
      ""
    );

    setValue(
      "productPrice",
      ""
    );

    setValue(
      "productDiscountPrice",
      ""
    );

    setValue(
      "productStock",
      "0"
    );

    setValue(
      "productImage",
      ""
    );

    setValue(
      "productSizes",
      ""
    );

    setValue(
      "productColors",
      ""
    );

    setValue(
      "productDescription",
      ""
    );


    const button =
      el("saveProductBtn");


    if (button) {
      button.textContent =
        "Save Product";
    }


    return;
  }


  // EDIT MODE

  editingProductId =
    product.id;


  setValue(
    "productId",
    product.id
  );

  setValue(
    "productName",
    product.name
  );

  setValue(
    "productCategory",
    product.category_id
  );

  setValue(
    "productPrice",
    product.price
  );

  setValue(
    "productDiscountPrice",
    product.discount_price ??
      ""
  );

  setValue(
    "productStock",
    product.stock
  );

  setValue(
    "productImage",
    product.image_url ??
      ""
  );

  setValue(
    "productSizes",
    Array.isArray(
      product.sizes
    )
      ? product.sizes.join(", ")
      : product.sizes || ""
  );

  setValue(
    "productColors",
    Array.isArray(
      product.colors
    )
      ? product.colors.join(", ")
      : product.colors || ""
  );

  setValue(
    "productDescription",
    product.description ??
      ""
  );


  const button =
    el("saveProductBtn");


  if (button) {

    button.textContent =
      "Update Product";

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ============================================================
// CLOSE PRODUCT FORM
// ============================================================

function closeProductForm() {

  const box =
    el("productFormBox");


  if (box) {
    box.style.display =
      "none";
  }


  editingProductId =
    null;


  const form =
    el("productForm");


  if (form) {
    form.reset();
  }


  setValue(
    "productId",
    ""
  );


  const button =
    el("saveProductBtn");


  if (button) {
    button.textContent =
      "Save Product";
  }

}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct() {

  const name =
    el("productName")
      ?.value.trim();


  const categoryId =
    el("productCategory")
      ?.value;


  const price =
    el("productPrice")
      ?.value;


  const discountPrice =
    el("productDiscountPrice")
      ?.value;


  const stock =
    el("productStock")
      ?.value;


  const imageUrl =
    el("productImage")
      ?.value.trim();


  const sizesText =
    el("productSizes")
      ?.value || "";


  const colorsText =
    el("productColors")
      ?.value || "";


  const description =
    el("productDescription")
      ?.value.trim();


  if (!name) {

    showProductMessage(
      "Please enter product name.",
      "error"
    );

    return;
  }


  if (!categoryId) {

    showProductMessage(
      "Please select category.",
      "error"
    );

    return;
  }


  if (
    !price ||
    Number(price) < 0
  ) {

    showProductMessage(
      "Please enter valid price.",
      "error"
    );

    return;
  }


  const button =
    el("saveProductBtn");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      editingProductId
        ? "Updating..."
        : "Saving...";

  }


  try {

    const sizes =
      sizesText
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);


    const colors =
      colorsText
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);


    let slug =
      makeSlug(name);


    // Check duplicate slug

    const {
      data: existing
    } =
      await supabaseClient
        .from("products")
        .select("id")
        .eq("slug", slug)
        .neq(
          "id",
          editingProductId || 0
        )
        .maybeSingle();


    if (existing) {

      slug =
        slug +
        "-" +
        Date.now();

    }


    const productData = {

      name,

      slug,

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

      sizes,

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

      const {
        error
      } =
        await supabaseClient
          .from("products")
          .update(productData)
          .eq(
            "id",
            editingProductId
          );


      if (error) {
        throw error;
      }


      alert(
        "Product updated successfully!"
      );

    }

    else {

      productData.created_at =
        new Date().toISOString();


      const {
        error
      } =
        await supabaseClient
          .from("products")
          .insert(
            productData
          );


      if (error) {
        throw error;
      }


      alert(
        "Product added successfully!"
      );

    }


    closeProductForm();

    await loadProducts();

    await loadDashboardStats();

  }

  catch (error) {

    console.error(
      "SAVE PRODUCT ERROR:",
      error
    );


    showProductMessage(
      error.message ||
      "Could not save product.",
      "error"
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        editingProductId
          ? "Update Product"
          : "Save Product";

    }

  }

}


// ============================================================
// PRODUCT MESSAGE
// ============================================================

function showProductMessage(
  message,
  type = "info"
) {

  const box =
    el("productMessage");


  if (!box) return;


  box.textContent =
    message;


  box.style.color =
    type === "error"
      ? "#dc2626"
      : type === "success"
        ? "#16a34a"
        : "#2563eb";

}


// ============================================================
// EDIT PRODUCT
// ============================================================

async function editProduct(
  productId
) {

  console.log(
    "EDIT PRODUCT:",
    productId
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("products")
        .select("*")
        .eq(
          "id",
          productId
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    if (!data) {

      alert(
        "Product not found."
      );

      return;
    }


    openProductForm(data);

  }

  catch (error) {

    console.error(
      "EDIT ERROR:",
      error
    );


    alert(
      error.message ||
      "Could not edit product."
    );

  }

}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(
  productId
) {

  const confirmDelete =
    confirm(
      "Are you sure you want to delete this product?"
    );


  if (!confirmDelete) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from("products")
        .delete()
        .eq(
          "id",
          productId
        );


    if (error) {
      throw error;
    }


    alert(
      "Product deleted successfully!"
    );


    await loadProducts();

    await loadDashboardStats();

  }

  catch (error) {

    console.error(
      "DELETE ERROR:",
      error
    );


    alert(
      error.message ||
      "Could not delete product."
    );

  }

}


// ============================================================
// ENABLE / DISABLE
// ============================================================

async function toggleProductStatus(
  productId,
  currentStatus
) {

  try {

    const {
      error
    } =
      await supabaseClient
        .from("products")
        .update({
          is_active:
            !currentStatus,

          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          productId
        );


    if (error) {
      throw error;
    }


    await loadProducts();

  }

  catch (error) {

    console.error(
      "STATUS ERROR:",
      error
    );


    alert(
      error.message ||
      "Could not change status."
    );

  }

}


// ============================================================
// ORDERS
// ============================================================

async function loadOrders() {

  const tbody =
    el("ordersTableBody");


  if (!tbody) return;


  tbody.innerHTML = `
    <tr>
      <td colspan="8"
          style="text-align:center;">
        Loading orders...
      </td>
    </tr>
  `;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (!data?.length) {

      tbody.innerHTML = `
        <tr>
          <td colspan="8"
              style="text-align:center;">
            No orders yet.
          </td>
        </tr>
      `;

      return;
    }


    tbody.innerHTML =
      data.map(order => `

        <tr>

          <td>
            #${escapeHTML(
              order.id
            )}
          </td>

          <td>
            ${escapeHTML(
              order.customer_name
            )}
          </td>

          <td>
            ${escapeHTML(
              order.phone
            )}
          </td>

          <td>
            ${formatMoney(
              order.total_amount
            )}
          </td>

          <td>
            ${escapeHTML(
              order.payment_status
            )}
          </td>

          <td>
            ${escapeHTML(
              order.status
            )}
          </td>

          <td>
            ${formatDate(
              order.created_at
            )}
          </td>

          <td>

            <button
              type="button"
              class="btn btn-primary"
              onclick="
                viewOrder(
                  ${order.id}
                )
              "
            >
              View
            </button>

            <button
              type="button"
              class="btn btn-warning"
              onclick="
                updateOrderStatus(
                  ${order.id},
                  'processing'
                )
              "
            >
              Processing
            </button>

            <button
              type="button"
              class="btn btn-success"
              onclick="
                updateOrderStatus(
                  ${order.id},
                  'delivered'
                )
              "
            >
              Delivered
            </button>

          </td>

        </tr>

      `).join("");

  }

  catch (error) {

    console.error(
      "ORDERS ERROR:",
      error
    );


    tbody.innerHTML = `
      <tr>
        <td colspan="8"
            style="
              color:red;
              text-align:center;
            ">
          ${escapeHTML(
            error.message
          )}
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

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .select(
          "id,total_amount,status,payment_status"
        );


    if (error) {
      throw error;
    }


    const orders =
      data || [];


    const pending =
      orders.filter(
        x =>
          x.status ===
          "pending"
      ).length;


    const processing =
      orders.filter(
        x =>
          x.status ===
          "processing"
      ).length;


    const delivered =
      orders.filter(
        x =>
          x.status ===
          "delivered"
      ).length;


    const sales =
      orders
        .filter(
          x =>
            x.payment_status ===
            "paid"
        )
        .reduce(
          (
            total,
            x
          ) =>
            total +
            Number(
              x.total_amount || 0
            ),
          0
        );


    if (el("totalOrders")) {
      el("totalOrders")
        .textContent =
        orders.length;
    }


    if (el("pendingOrders")) {
      el("pendingOrders")
        .textContent =
        pending;
    }


    if (el("processingOrders")) {
      el("processingOrders")
        .textContent =
        processing;
    }


    if (el("deliveredOrders")) {
      el("deliveredOrders")
        .textContent =
        delivered;
    }


    if (el("totalSales")) {
      el("totalSales")
        .textContent =
        formatMoney(sales);
    }

  }

  catch (error) {

    console.error(
      "STATS ERROR:",
      error
    );

  }

}


// ============================================================
// VIEW ORDER
// ============================================================

async function viewOrder(
  orderId
) {

  try {

    const {
      data: order,
      error
    } =
      await supabaseClient
        .from("orders")
        .select("*")
        .eq(
          "id",
          orderId
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    if (!order) {

      alert(
        "Order not found."
      );

      return;
    }


    const {
      data: items,
      error: itemsError
    } =
      await supabaseClient
        .from("order_items")
        .select("*")
        .eq(
          "order_id",
          orderId
        );


    if (itemsError) {
      throw itemsError;
    }


    const details =
      el("orderDetails");


    if (!details) return;


    details.innerHTML = `

      <h3>
        Order #${escapeHTML(
          order.id
        )}
      </h3>

      <p>
        <strong>Customer:</strong>
        ${escapeHTML(
          order.customer_name
        )}
      </p>

      <p>
        <strong>Phone:</strong>
        ${escapeHTML(
          order.phone
        )}
      </p>

      <p>
        <strong>WhatsApp:</strong>
        ${escapeHTML(
          order.whatsapp || "-"
        )}
      </p>

      <p>
        <strong>Email:</strong>
        ${escapeHTML(
          order.email || "-"
        )}
      </p>

      <p>
        <strong>Address:</strong>
        ${escapeHTML(
          order.address
        )}
      </p>

      <p>
        <strong>City:</strong>
        ${escapeHTML(
          order.city || "-"
        )}
      </p>

      <p>
        <strong>State:</strong>
        ${escapeHTML(
          order.state || "-"
        )}
      </p>

      <p>
        <strong>Status:</strong>
        ${escapeHTML(
          order.status
        )}
      </p>

      <p>
        <strong>Payment:</strong>
        ${escapeHTML(
          order.payment_status
        )}
      </p>

      <hr>

      <h4>
        Products
      </h4>

      ${
        items?.length
          ? items.map(item => `

              <div
                style="
                  padding:10px 0;
                  border-bottom:
                    1px solid #ddd;
                "
              >

                <strong>
                  ${escapeHTML(
                    item.product_name
                  )}
                </strong>

                <br>

                Quantity:
                ${Number(
                  item.quantity
                )}

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

            `).join("")
          : "<p>No items found.</p>"
      }

      <hr>

      <h3>
        Total:
        ${formatMoney(
          order.total_amount
        )}
      </h3>

    `;


    const modal =
      el("orderModal");


    if (modal) {
      modal.style.display =
        "flex";
    }

  }

  catch (error) {

    console.error(
      "VIEW ORDER ERROR:",
      error
    );


    alert(
      error.message ||
      "Could not load order."
    );

  }

}


// ============================================================
// CLOSE ORDER MODAL
// ============================================================

function closeOrderModal() {

  const modal =
    el("orderModal");


  if (modal) {
    modal.style.display =
      "none";
  }

}


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

async function updateOrderStatus(
  orderId,
  status
) {

  try {

    const {
      error
    } =
      await supabaseClient
        .from("orders")
        .update({
          status
        })
        .eq(
          "id",
          orderId
        );


    if (error) {
      throw error;
    }


    await loadOrders();

    await loadDashboardStats();

  }

  catch (error) {

    console.error(
      "UPDATE ORDER ERROR:",
      error
    );


    alert(
      error.message ||
      "Could not update order."
    );

  }

}


// ============================================================
// AUTH LISTENER
// ============================================================

supabaseClient.auth
  .onAuthStateChange(
    (event) => {

      console.log(
        "AUTH EVENT:",
        event
      );


      if (
        event ===
        "SIGNED_OUT"
      ) {

        showLoginSection();

      }

    }
  );


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.editProduct =
  editProduct;

window.deleteProduct =
  deleteProduct;

window.toggleProductStatus =
  toggleProductStatus;

window.viewOrder =
  viewOrder;

window.updateOrderStatus =
  updateOrderStatus;

window.openProductForm =
  openProductForm;

window.closeProductForm =
  closeProductForm;

window.closeOrderModal =
  closeOrderModal;
