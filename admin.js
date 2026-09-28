/* =====================================================
   MAYA CLOTHING
   ADMIN DASHBOARD
===================================================== */


/* =====================================================
   SUPABASE
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

const loginSection =
  document.getElementById("loginSection");

const dashboard =
  document.getElementById("dashboard");

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const ordersTableBody =
  document.getElementById("ordersTableBody");

const ordersMessage =
  document.getElementById("ordersMessage");

const productsTableBody =
  document.getElementById("productsTableBody");

const productMessage =
  document.getElementById("productMessage");

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

const orderModal =
  document.getElementById("orderModal");

const closeModalBtn =
  document.getElementById("closeModalBtn");


/* =====================================================
   HELPERS
===================================================== */

function showMessage(
  element,
  message,
  type
) {

  element.textContent =
    message;

  element.className =
    "message " +
    (
      type === "success"
        ? "success-message"
        : "error-message"
    );

  element.style.display =
    "block";

}


function hideMessage(element) {

  element.style.display =
    "none";

}


function formatMoney(amount) {

  return "₦" +
    Number(amount || 0).toLocaleString(
      "en-NG",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    );

}


function formatDate(date) {

  return new Date(date).toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

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

  return text
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    ) +
    "-" +
    Date.now();

}


/* =====================================================
   LOGIN / ADMIN SECURITY
===================================================== */

async function checkAdmin() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {

    showLogin();

    return false;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("admin_users")
      .select("id")
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(error);

    await supabaseClient.auth.signOut();

    showLogin();

    showMessage(
      loginMessage,
      "Unable to verify admin account.",
      "error"
    );

    return false;

  }


  if (!data) {

    await supabaseClient.auth.signOut();

    showLogin();

    showMessage(
      loginMessage,
      "This account is not authorized as an admin.",
      "error"
    );

    return false;

  }


  showDashboard();

  return true;

}


/* =====================================================
   SHOW LOGIN
===================================================== */

function showLogin() {

  loginSection.style.display =
    "block";

  dashboard.style.display =
    "none";

}


/* =====================================================
   SHOW DASHBOARD
===================================================== */

async function showDashboard() {

  loginSection.style.display =
    "none";

  dashboard.style.display =
    "block";


  await loadProductCategories();

  await loadAdminProducts();

  await loadOrders();

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
      document
        .getElementById("adminEmail")
        .value
        .trim();

    const password =
      document
        .getElementById("adminPassword")
        .value;


    loginBtn.disabled =
      true;

    loginBtn.textContent =
      "Logging in...";


    const {
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email: email,
          password: password
        });


    if (error) {

      showMessage(
        loginMessage,
        error.message,
        "error"
      );

      loginBtn.disabled =
        false;

      loginBtn.textContent =
        "Login";

      return;

    }


    const isAdmin =
      await checkAdmin();


    if (!isAdmin) {

      loginBtn.disabled =
        false;

      loginBtn.textContent =
        "Login";

      return;

    }


    loginBtn.disabled =
      false;

    loginBtn.textContent =
      "Login";

  }
);


/* =====================================================
   LOGOUT
===================================================== */

logoutBtn.addEventListener(
  "click",
  async function() {

    await supabaseClient.auth.signOut();

    dashboard.style.display =
      "none";

    loginSection.style.display =
      "block";

    loginForm.reset();

    showMessage(
      loginMessage,
      "You have been logged out.",
      "success"
    );

  }
);


/* =====================================================
   PRODUCT CATEGORIES
===================================================== */

async function loadProductCategories() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("categories")
      .select("id,name")
      .order("name");


  if (error) {

    console.error(error);

    showMessage(
      productMessage,
      "Could not load categories: " +
      error.message,
      "error"
    );

    return;

  }


  productCategory.innerHTML =
    '<option value="">Select Category</option>';


  data.forEach(category => {

    const option =
      document.createElement("option");

    option.value =
      category.id;

    option.textContent =
      category.name;

    productCategory.appendChild(
      option
    );

  });

}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadAdminProducts() {

  productsTableBody.innerHTML =
    `
      <tr>
        <td colspan="8">
          Loading products...
        </td>
      </tr>
    `;


  const {
    data: products,
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

    console.error(error);

    productsTableBody.innerHTML =
      "";

    showMessage(
      productMessage,
      "Could not load products: " +
      error.message,
      "error"
    );

    return;

  }


  displayAdminProducts(
    products || []
  );

}


/* =====================================================
   DISPLAY PRODUCTS
===================================================== */

function displayAdminProducts(
  products
) {

  productsTableBody.innerHTML =
    "";


  if (products.length === 0) {

    productsTableBody.innerHTML =
      `
        <tr>
          <td colspan="8">
            No products found.
          </td>
        </tr>
      `;

    return;

  }


  products.forEach(product => {

    const row =
      document.createElement("tr");


    const imageHtml =
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
        ${imageHtml}
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
      </td>

      <td>
        ${
          product.discount_price !== null
            ? formatMoney(
                product.discount_price
              )
            : "-"
        }
      </td>

      <td>
        ${product.stock}
      </td>

      <td>

        ${
          product.is_active
            ? `
              <span class="status-active">
                Active
              </span>
            `
            : `
              <span class="status-inactive">
                Inactive
              </span>
            `
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
            onclick="
              toggleProduct(
                ${product.id},
                ${product.is_active}
              )
            "
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


    productsTableBody.appendChild(
      row
    );

  });

}


/* =====================================================
   ADD PRODUCT BUTTON
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


    hideMessage(
      productMessage
    );


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


    hideMessage(
      productMessage
    );

  }
);


/* =====================================================
   SAVE / UPDATE PRODUCT
===================================================== */

productForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    hideMessage(
      productMessage
    );


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


    /* VALIDATION */

    if (!name) {

      showMessage(
        productMessage,
        "Product name is required.",
        "error"
      );

      return;

    }


    if (!categoryId) {

      showMessage(
        productMessage,
        "Please select a category.",
        "error"
      );

      return;

    }


    if (
      !Number.isFinite(price) ||
      price < 0
    ) {

      showMessage(
        productMessage,
        "Please enter a valid price.",
        "error"
      );

      return;

    }


    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {

      showMessage(
        productMessage,
        "Stock must be a valid number.",
        "error"
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
        !Number.isFinite(
          discountPrice
        ) ||
        discountPrice < 0
      )
    ) {

      showMessage(
        productMessage,
        "Please enter a valid discount price.",
        "error"
      );

      return;

    }


    if (
      discountPrice !== null &&
      discountPrice > price
    ) {

      showMessage(
        productMessage,
        "Discount price cannot be higher than regular price.",
        "error"
      );

      return;

    }


    const sizes =
      sizesText
        ? sizesText
            .split(",")
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        : [];


    const colors =
      colorsText
        ? colorsText
            .split(",")
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        : [];


    const productData = {

      name: name,

      slug:
        id
          ? undefined
          : createSlug(name),

      description:
        description || null,

      price:
        price,

      discount_price:
        discountPrice,

      category_id:
        Number(categoryId),

      sizes:
        sizes,

      colors:
        colors,

      stock:
        stock,

      image_url:
        imageUrl || null,

      updated_at:
        new Date().toISOString()

    };


    /*
      Do not send undefined slug
      during update.
    */

    if (id) {

      delete productData.slug;

    }


    saveProductBtn.disabled =
      true;


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
          .insert(
            productData
          );

    }


    if (result.error) {

      console.error(
        result.error
      );


      showMessage(
        productMessage,
        "Could not save product: " +
        result.error.message,
        "error"
      );


      saveProductBtn.disabled =
        false;


      saveProductBtn.textContent =
        id
          ? "Update Product"
          : "Save Product";


      return;

    }


    showMessage(
      productMessage,
      id
        ? "Product updated successfully."
        : "Product added successfully.",
      "success"
    );


    productForm.reset();


    document.getElementById(
      "productId"
    ).value = "";


    productFormBox.style.display =
      "none";


    saveProductBtn.disabled =
      false;


    saveProductBtn.textContent =
      "Save Product";


    await loadAdminProducts();

  }
);


/* =====================================================
   EDIT PRODUCT
===================================================== */

async function editProduct(
  productId
) {

  const {
    data: product,
    error
  } =
    await supabaseClient
      .from("products")
      .select("*")
      .eq(
        "id",
        productId
      )
      .single();


  if (error) {

    console.error(error);

    alert(
      "Could not load product: " +
      error.message
    );

    return;

  }


  await loadProductCategories();


  document.getElementById(
    "productId"
  ).value =
    product.id;


  document.getElementById(
    "productName"
  ).value =
    product.name || "";


  document.getElementById(
    "productDescription"
  ).value =
    product.description || "";


  document.getElementById(
    "productCategory"
  ).value =
    product.category_id || "";


  document.getElementById(
    "productPrice"
  ).value =
    product.price ?? "";


  document.getElementById(
    "productDiscountPrice"
  ).value =
    product.discount_price ?? "";


  document.getElementById(
    "productStock"
  ).value =
    product.stock ?? 0;


  document.getElementById(
    "productSizes"
  ).value =
    Array.isArray(product.sizes)
      ? product.sizes.join(", ")
      : "";


  document.getElementById(
    "productColors"
  ).value =
    Array.isArray(product.colors)
      ? product.colors.join(", ")
      : "";


  document.getElementById(
    "productImage"
  ).value =
    product.image_url || "";


  saveProductBtn.textContent =
    "Update Product";


  hideMessage(
    productMessage
  );


  productFormBox.style.display =
    "block";


  productFormBox.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =====================================================
   ACTIVATE / DEACTIVATE PRODUCT
===================================================== */

async function toggleProduct(
  productId,
  currentStatus
) {

  const newStatus =
    !currentStatus;


  const action =
    newStatus
      ? "activate"
      : "deactivate";


  const confirmed =
    confirm(
      "Are you sure you want to " +
      action +
      " this product?"
    );


  if (!confirmed) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("products")
      .update({
        is_active:
          newStatus,

        updated_at:
          new Date().toISOString()
      })
      .eq(
        "id",
        productId
      );


  if (error) {

    console.error(error);

    alert(
      "Could not update product: " +
      error.message
    );

    return;

  }


  await loadAdminProducts();

}


/* =====================================================
   ORDERS
===================================================== */

async function loadOrders() {

  ordersTableBody.innerHTML =
    `
      <tr>
        <td colspan="8">
          Loading orders...
        </td>
      </tr>
    `;


  hideMessage(
    ordersMessage
  );


  const {
    data: orders,
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

    console.error(error);

    ordersTableBody.innerHTML =
      "";

    showMessage(
      ordersMessage,
      "Could not load orders: " +
      error.message,
      "error"
    );

    return;

  }


  updateStatistics(
    orders || []
  );


  displayOrders(
    orders || []
  );

}


/* =====================================================
   ORDER STATISTICS
===================================================== */

function updateStatistics(
  orders
) {

  const total =
    orders.length;


  const pending =
    orders.filter(
      order =>
        order.status === "pending"
    ).length;


  const processing =
    orders.filter(
      order =>
        order.status === "processing" ||
        order.status === "confirmed"
    ).length;


  const delivered =
    orders.filter(
      order =>
        order.status === "delivered"
    ).length;


  const sales =
    orders.reduce(
      (
        totalAmount,
        order
      ) =>
        totalAmount +
        Number(
          order.total_amount || 0
        ),
      0
    );


  document.getElementById(
    "totalOrders"
  ).textContent =
    total;


  document.getElementById(
    "pendingOrders"
  ).textContent =
    pending;


  document.getElementById(
    "processingOrders"
  ).textContent =
    processing;


  document.getElementById(
    "deliveredOrders"
  ).textContent =
    delivered;


  document.getElementById(
    "totalSales"
  ).textContent =
    formatMoney(sales);

}


/* =====================================================
   DISPLAY ORDERS
===================================================== */

function displayOrders(
  orders
) {

  ordersTableBody.innerHTML =
    "";


  if (orders.length === 0) {

    ordersTableBody.innerHTML =
      `
        <tr>
          <td colspan="8">
            No orders yet.
          </td>
        </tr>
      `;

    return;

  }


  orders.forEach(order => {

    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        <strong>
          MAYA-${order.id}
        </strong>
      </td>

      <td>
        ${escapeHtml(
          order.customer_name
        )}
      </td>

      <td>
        ${escapeHtml(
          order.phone
        )}
      </td>

      <td>
        ${formatMoney(
          order.total_amount
        )}
      </td>

      <td>
        ${escapeHtml(
          order.payment_status
        )}
      </td>

      <td>

        <select
          class="status-select"
          data-order-id="${order.id}"
        >

          <option
            value="pending"
            ${
              order.status === "pending"
                ? "selected"
                : ""
            }
          >
            Pending
          </option>

          <option
            value="confirmed"
            ${
              order.status === "confirmed"
                ? "selected"
                : ""
            }
          >
            Confirmed
          </option>

          <option
            value="processing"
            ${
              order.status === "processing"
                ? "selected"
                : ""
            }
          >
            Processing
          </option>

          <option
            value="shipped"
            ${
              order.status === "shipped"
                ? "selected"
                : ""
            }
          >
            Shipped
          </option>

          <option
            value="delivered"
            ${
              order.status === "delivered"
                ? "selected"
                : ""
            }
          >
            Delivered
          </option>

          <option
            value="cancelled"
            ${
              order.status === "cancelled"
                ? "selected"
                : ""
            }
          >
            Cancelled
          </option>

        </select>

      </td>

      <td>
        ${formatDate(
          order.created_at
        )}
      </td>

      <td>

        <button
          class="admin-btn primary-btn small-btn"
          onclick="
            viewOrder(${order.id})
          "
        >
          View
        </button>

      </td>

    `;


    const statusSelect =
      row.querySelector(
        ".status-select"
      );


    statusSelect.addEventListener(
      "change",
      function() {

        updateOrderStatus(
          order.id,
          this.value
        );

      }
    );


    ordersTableBody.appendChild(
      row
    );

  });

}


/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

async function updateOrderStatus(
  orderId,
  newStatus
) {

  const {
    error
  } =
    await supabaseClient
      .from("orders")
      .update({
        status:
          newStatus
      })
      .eq(
        "id",
        orderId
      );


  if (error) {

    console.error(error);

    alert(
      "Could not update order: " +
      error.message
    );

    await loadOrders();

    return;

  }


  await loadOrders();

}


/* =====================================================
   VIEW ORDER
===================================================== */

async function viewOrder(
  orderId
) {

  document.getElementById(
    "modalOrderTitle"
  ).textContent =
    "Order MAYA-" +
    orderId;


  document.getElementById(
    "orderDetails"
  ).innerHTML =
    "<p>Loading order...</p>";


  orderModal.style.display =
    "block";


  const {
    data: order,
    error: orderError
  } =
    await supabaseClient
      .from("orders")
      .select("*")
      .eq(
        "id",
        orderId
      )
      .single();


  if (orderError) {

    document.getElementById(
      "orderDetails"
    ).innerHTML =
      `
        <p>
          Could not load order.
        </p>
      `;

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
      )
      .order("id");


  if (itemsError) {

    document.getElementById(
      "orderDetails"
    ).innerHTML =
      `
        <p>
          Could not load order items.
        </p>
      `;

    return;

  }


  let itemsHtml =
    "";


  items.forEach(item => {

    itemsHtml += `

      <div class="order-item">

        <div>

          <strong>
            ${escapeHtml(
              item.product_name
            )}
          </strong>

          <br>

          Quantity:
          ${item.quantity}

          ×

          ${formatMoney(
            item.unit_price
          )}

        </div>

        <strong>

          ${formatMoney(
            item.subtotal
          )}

        </strong>

      </div>

    `;

  });


  document.getElementById(
    "orderDetails"
  ).innerHTML = `

    <div class="customer-info">

      <strong>
        Customer:
      </strong>

      ${escapeHtml(
        order.customer_name
      )}

      <br>

      <strong>
        Phone:
      </strong>

      ${escapeHtml(
        order.phone
      )}

      <br>

      <strong>
        WhatsApp:
      </strong>

      ${escapeHtml(
        order.whatsapp || "-"
      )}

      <br>

      <strong>
        Email:
      </strong>

      ${escapeHtml(
        order.email || "-"
      )}

      <br>

      <strong>
        Address:
      </strong>

      ${escapeHtml(
        order.address
      )}

      <br>

      <strong>
        City:
      </strong>

      ${escapeHtml(
        order.city || "-"
      )}

      <br>

      <strong>
        State:
      </strong>

      ${escapeHtml(
        order.state || "-"
      )}

      <br>

      <strong>
        Payment:
      </strong>

      ${escapeHtml(
        order.payment_status
      )}

      <br>

      <strong>
        Status:
      </strong>

      ${escapeHtml(
        order.status
      )}

      <br>

      <strong>
        Date:
      </strong>

      ${formatDate(
        order.created_at
      )}

      ${
        order.notes
          ? `
            <br>
            <strong>
              Notes:
            </strong>

            ${escapeHtml(
              order.notes
            )}
          `
          : ""
      }

    </div>


    <h3>
      Products
    </h3>

    ${
      itemsHtml ||
      "<p>No products found.</p>"
    }


    <div class="order-total">

      Total:
      ${formatMoney(
        order.total_amount
      )}

    </div>

  `;

}


/* =====================================================
   CLOSE ORDER MODAL
===================================================== */

closeModalBtn.addEventListener(
  "click",
  function() {

    orderModal.style.display =
      "none";

  }
);


orderModal.addEventListener(
  "click",
  function(event) {

    if (
      event.target === orderModal
    ) {

      orderModal.style.display =
        "none";

    }

  }
);


/* =====================================================
   REFRESH ORDERS
===================================================== */

document.getElementById(
  "refreshOrdersBtn"
).addEventListener(
  "click",
  async function() {

    await loadOrders();

  }
);


/* =====================================================
   AUTH STATE
===================================================== */

supabaseClient.auth.onAuthStateChange(
  async function(
    event,
    session
  ) {

    if (
      event === "SIGNED_OUT"
    ) {

      showLogin();

      return;

    }


    if (
      session &&
      (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      )
    ) {

      /*
        Give Supabase a moment to
        finish restoring the session.
      */

      setTimeout(
        async function() {

          await checkAdmin();

        },
        100
      );

    }

  }
);


/* =====================================================
   START APPLICATION
===================================================== */

checkAdmin();
