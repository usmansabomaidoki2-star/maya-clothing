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
  type = "error"
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

  return (
    text
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
      )
    +
    "-"
    +
    Date.now()
  );

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

function showDashboard() {

  loginSection.style.display =
    "none";

  dashboard.style.display =
    "block";

}


/* =====================================================
   CHECK ADMIN
===================================================== */

async function checkAdmin() {

  try {

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
      data: admin,
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

      console.error(
        "Admin check error:",
        error
      );

      showLogin();

      showMessage(
        loginMessage,
        "Unable to verify admin account: " +
        error.message,
        "error"
      );

      return false;

    }


    if (!admin) {

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


    await loadProductCategories();

    await loadAdminProducts();

    await loadOrders();


    return true;

  }

  catch (error) {

    console.error(error);

    showLogin();

    showMessage(
      loginMessage,
      "Something went wrong. Please try again.",
      "error"
    );

    return false;

  }

}


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    hideMessage(
      loginMessage
    );


    const email =
      document
        .getElementById(
          "adminEmail"
        )
        .value
        .trim();


    const password =
      document
        .getElementById(
          "adminPassword"
        )
        .value;


    if (!email || !password) {

      showMessage(
        loginMessage,
        "Please enter email and password.",
        "error"
      );

      return;

    }


    loginBtn.disabled =
      true;

    loginBtn.textContent =
      "Logging in...";


    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email: email,
          password: password
        });


    if (error) {

      console.error(
        "Login error:",
        error
      );

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


    /*
      IMPORTANT:
      Use the returned user directly
      instead of waiting for an
      auth-state event.
    */

    if (!data || !data.user) {

      showMessage(
        loginMessage,
        "Login failed. Please try again.",
        "error"
      );

      loginBtn.disabled =
        false;

      loginBtn.textContent =
        "Login";

      return;

    }


    const {
      data: admin,
      error: adminError
    } =
      await supabaseClient
        .from("admin_users")
        .select("id")
        .eq(
          "id",
          data.user.id
        )
        .maybeSingle();


    if (adminError) {

      console.error(
        "Admin verification error:",
        adminError
      );

      showMessage(
        loginMessage,
        "Could not verify admin: " +
        adminError.message,
        "error"
      );

      loginBtn.disabled =
        false;

      loginBtn.textContent =
        "Login";

      return;

    }


    if (!admin) {

      await supabaseClient.auth.signOut();

      showLogin();

      showMessage(
        loginMessage,
        "This account is not authorized as an admin.",
        "error"
      );

      loginBtn.disabled =
        false;

      loginBtn.textContent =
        "Login";

      return;

    }


    /*
      ADMIN VERIFIED
    */

    showDashboard();


    loginBtn.disabled =
      false;

    loginBtn.textContent =
      "Login";


    await loadProductCategories();

    await loadAdminProducts();

    await loadOrders();

  }
);


/* =====================================================
   LOGOUT
===================================================== */

logoutBtn.addEventListener(
  "click",
  async function() {

    logoutBtn.disabled =
      true;

    logoutBtn.textContent =
      "Logging out...";


    await supabaseClient.auth.signOut();


    loginForm.reset();


    showLogin();


    hideMessage(
      loginMessage
    );


    logoutBtn.disabled =
      false;

    logoutBtn.textContent =
      "Logout";

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
      .select(
        "id,name"
      )
      .order("name");


  if (error) {

    console.error(error);

    return;

  }


  productCategory.innerHTML =
    `
      <option value="">
        Select Category
      </option>
    `;


  data.forEach(
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
      `
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

function displayAdminProducts(
  products
) {

  productsTableBody.innerHTML =
    "";


  if (!products.length) {

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


  products.forEach(
    product => {

      const row =
        document.createElement(
          "tr"
        );


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
          ${formatMoney(
            product.price
          )}
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
              onclick="
                editProduct(${product.id})
              "
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

    }
  );

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
    ).value =
      "";


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
    ).value =
      "";


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
   SAVE PRODUCT
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
        : Number(
            discountValue
          );


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

      description:
        description || null,

      price: price,

      discount_price:
        discountPrice,

      category_id:
        Number(categoryId),

      sizes: sizes,

      colors: colors,

      stock: stock,

      image_url:
        imageUrl || null,

      updated_at:
        new Date().toISOString()

    };


    if (!id) {

      productData.slug =
        createSlug(name);

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
          .update(
            productData
          )
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


    productForm.reset();


    document.getElementById(
      "productId"
    ).value =
      "";


    productFormBox.style.display =
      "none";


    showMessage(
      productMessage,
      id
        ? "Product updated successfully."
        : "Product added successfully.",
      "success"
    );


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

    alert(
      "Could not load product: " +
      error.message
    );

    return;

  }


  await loadProductCategories();


  document.getElementById(
