const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


const loginSection =
  document.getElementById("loginSection");

const dashboard =
  document.getElementById("dashboard");

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");

const logoutBtn =
  document.getElementById("logoutBtn");

const ordersTableBody =
  document.getElementById("ordersTableBody");

const ordersMessage =
  document.getElementById("ordersMessage");

const orderModal =
  document.getElementById("orderModal");

const closeModalBtn =
  document.getElementById("closeModalBtn");


function showMessage(element, message, type) {

  element.textContent = message;

  element.className =
    "message " + type;

  element.style.display = "block";
}


function hideMessage(element) {

  element.style.display = "none";

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


/* =========================
   CHECK ADMIN
========================= */

async function checkAdmin() {

  const {
    data: {
      user
    }
  } = await supabaseClient.auth.getUser();


  if (!user) {

    showLogin();

    return false;

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

    console.error(error);

    showMessage(
      loginMessage,
      "Unable to verify admin account.",
      "error"
    );

    showLogin();

    return false;

  }


  if (!data) {

    await supabaseClient.auth.signOut();

    showMessage(
      loginMessage,
      "This account is not authorized as an admin.",
      "error"
    );

    showLogin();

    return false;

  }


  showDashboard();

  return true;

}


/* =========================
   LOGIN
========================= */

loginForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    hideMessage(loginMessage);

    const email =
      document.getElementById(
        "adminEmail"
      ).value.trim();

    const password =
      document.getElementById(
        "adminPassword"
      ).value;


    const loginBtn =
      document.getElementById(
        "loginBtn"
      );

    loginBtn.disabled = true;

    loginBtn.textContent =
      "Logging in...";


    const {
      data,
      error
    } = await supabaseClient.auth
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

      loginBtn.disabled = false;

      loginBtn.textContent =
        "Login";

      return;

    }


    const isAdmin =
      await checkAdmin();


    if (!isAdmin) {

      loginBtn.disabled = false;

      loginBtn.textContent =
        "Login";

      return;

    }


    loginBtn.disabled = false;

    loginBtn.textContent =
      "Login";

  }
);


/* =========================
   SHOW LOGIN
========================= */

function showLogin() {

  loginSection.style.display =
    "block";

  dashboard.style.display =
    "none";

}


/* =========================
   SHOW DASHBOARD
========================= */

async function showDashboard() {

  loginSection.style.display =
    "none";

  dashboard.style.display =
    "block";

  await loadOrders();

}


/* =========================
   LOAD ORDERS
========================= */

async function loadOrders() {

  ordersTableBody.innerHTML =
    "<tr><td colspan='8'>Loading orders...</td></tr>";

  hideMessage(ordersMessage);


  const {
    data: orders,
    error
  } = await supabaseClient
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

    ordersTableBody.innerHTML = "";

    showMessage(
      ordersMessage,
      "Could not load orders: " +
      error.message,
      "error"
    );

    return;

  }


  updateStatistics(orders || []);

  displayOrders(orders || []);

}


/* =========================
   STATISTICS
========================= */

function updateStatistics(orders) {

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
      (sum, order) =>
        sum + Number(
          order.total_amount || 0
        ),
      0
    );


  document.getElementById(
    "totalOrders"
  ).textContent = total;


  document.getElementById(
    "pendingOrders"
  ).textContent = pending;


  document.getElementById(
    "processingOrders"
  ).textContent = processing;


  document.getElementById(
    "deliveredOrders"
  ).textContent = delivered;


  document.getElementById(
    "totalSales"
  ).textContent =
    formatMoney(sales);

}


/* =========================
   DISPLAY ORDERS
========================= */

function displayOrders(orders) {

  ordersTableBody.innerHTML = "";


  if (orders.length === 0) {

    ordersTableBody.innerHTML =
      "<tr><td colspan='8'>No orders yet.</td></tr>";

    return;

  }


  orders.forEach(order => {

    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        MAYA-${order.id}
      </td>

      <td>
        ${escapeHtml(order.customer_name)}
      </td>

      <td>
        ${escapeHtml(order.phone)}
      </td>

      <td>
        ${formatMoney(order.total_amount)}
      </td>

      <td>
        ${escapeHtml(order.payment_status)}
      </td>

      <td>

        <select
          class="status-select"
          data-id="${order.id}"
        >

          <option value="pending"
            ${order.status === "pending" ? "selected" : ""}>
            Pending
          </option>

          <option value="confirmed"
            ${order.status === "confirmed" ? "selected" : ""}>
            Confirmed
          </option>

          <option value="processing"
            ${order.status === "processing" ? "selected" : ""}>
            Processing
          </option>

          <option value="shipped"
            ${order.status === "shipped" ? "selected" : ""}>
            Shipped
          </option>

          <option value="delivered"
            ${order.status === "delivered" ? "selected" : ""}>
            Delivered
          </option>

          <option value="cancelled"
            ${order.status === "cancelled" ? "selected" : ""}>
            Cancelled
          </option>

        </select>

      </td>

      <td>
        ${formatDate(order.created_at)}
      </td>

      <td>

        <button
          class="admin-btn view-btn"
          onclick="viewOrder(${order.id})"
        >
          View
        </button>

      </td>

    `;


    const select =
      row.querySelector(
        ".status-select"
      );


    select.addEventListener(
      "change",
      function() {

        updateOrderStatus(
          order.id,
          this.value
        );

      }
    );


    ordersTableBody.appendChild(row);

  });

}


/* =========================
   UPDATE STATUS
========================= */

async function updateOrderStatus(
  orderId,
  newStatus
) {

  const {
    error
  } = await supabaseClient
    .from("orders")
    .update({
      status: newStatus
    })
    .eq("id", orderId);


  if (error) {

    alert(
      "Could not update order: " +
      error.message
    );

    await loadOrders();

    return;

  }


  await loadOrders();

}


/* =========================
   VIEW ORDER
========================= */

async function viewOrder(orderId) {

  document.getElementById(
    "modalOrderTitle"
  ).textContent =
    "Order MAYA-" + orderId;


  document.getElementById(
    "orderDetails"
  ).innerHTML =
    "<p>Loading...</p>";


  orderModal.style.display =
    "block";


  const {
    data: order,
    error: orderError
  } = await supabaseClient
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();


  if (orderError) {

    document.getElementById(
      "orderDetails"
    ).innerHTML =
      "<p>Could not load order.</p>";

    return;

  }


  const {
    data: items,
    error: itemsError
  } = await supabaseClient
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);


  if (itemsError) {

    document.getElementById(
      "orderDetails"
    ).innerHTML =
      "<p>Could not load order items.</p>";

    return;

  }


  let itemsHtml = "";


  items.forEach(item => {

    itemsHtml += `

      <div class="order-item">

        <div>
          <strong>
            ${escapeHtml(item.product_name)}
          </strong>

          <br>

          Qty:
          ${item.quantity}

          ×
          ${formatMoney(item.unit_price)}
        </div>

        <strong>
          ${formatMoney(item.subtotal)}
        </strong>

      </div>

    `;

  });


  document.getElementById(
    "orderDetails"
  ).innerHTML = `

    <div class="customer-info">

      <strong>Customer:</strong>
      ${escapeHtml(order.customer_name)}
      <br>

      <strong>Phone:</strong>
      ${escapeHtml(order.phone)}
      <br>

      <strong>WhatsApp:</strong>
      ${escapeHtml(order.whatsapp || "-")}
      <br>

      <strong>Email:</strong>
      ${escapeHtml(order.email || "-")}
      <br>

      <strong>Address:</strong>
      ${escapeHtml(order.address)}
      <br>

      <strong>City:</strong>
      ${escapeHtml(order.city || "-")}
      <br>

      <strong>State:</strong>
      ${escapeHtml(order.state || "-")}
      <br>

      <strong>Payment:</strong>
      ${escapeHtml(order.payment_status)}
      <br>

      <strong>Status:</strong>
      ${escapeHtml(order.status)}
      <br>

      <strong>Date:</strong>
      ${formatDate(order.created_at)}

      ${
        order.notes
          ? `<br><strong>Notes:</strong>
             ${escapeHtml(order.notes)}`
          : ""
      }

    </div>


    <h3>Products</h3>

    ${itemsHtml}


    <div class="order-total">

      Total:
      ${formatMoney(order.total_amount)}

    </div>

  `;

}


/* =========================
   CLOSE MODAL
========================= */

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


/* =========================
   REFRESH
========================= */

document.getElementById(
  "refreshOrdersBtn"
).addEventListener(
  "click",
  loadOrders
);


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener(
  "click",
  async function() {

    await supabaseClient.auth.signOut();

    showLogin();

    loginForm.reset();

    showMessage(
      loginMessage,
      "You have been logged out.",
      "success"
    );

  }
);


/* =========================
   SECURITY HELPER
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================
   START
========================= */

checkAdmin();
