// ==========================================
// MAYA CLOTHING
// CUSTOMER APP
// ==========================================


// ==========================================
// SUPABASE CONFIG
// ==========================================

const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";


// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let allProducts = [];

let cart = [];


// ==========================================
// PAGE START
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "MAYA CLOTHING APP STARTED"
    );

    loadCart();

    updateCart();

    await loadCategories();

    await loadProducts();

  }
);


// ==========================================
// LOAD CATEGORIES
// ==========================================

async function loadCategories() {

  const box =
    document.getElementById(
      "categories"
    );

  if (!box) return;


  try {

    const result =
      await supabaseClient
        .from("categories")
        .select(
          "id, name, slug"
        )
        .order(
          "id",
          {
            ascending: true
          }
        );


    if (result.error) {

      console.error(
        "Categories error:",
        result.error
      );

      box.innerHTML = `
        <button
          type="button"
          onclick="loadProducts()"
        >
          All
        </button>
      `;

      return;

    }


    const data =
      result.data || [];


    box.innerHTML = `

      <button
        type="button"
        onclick="loadProducts()"
      >
        All
      </button>

    `;


    data.forEach(
      function (category) {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.textContent =
          category.name;


        button.onclick =
          function () {

            filterCategory(
              category.id
            );

          };


        box.appendChild(
          button
        );

      }
    );


  } catch (error) {

    console.error(
      "Category error:",
      error
    );

  }

}


// ==========================================
// LOAD ALL PRODUCTS
// ==========================================

async function loadProducts() {

  const box =
    document.getElementById(
      "products"
    );

  if (!box) return;


  box.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;


  try {

    const result =
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
          created_at
        `)
        .eq(
          "is_active",
          true
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (result.error) {

      console.error(
        "Products error:",
        result.error
      );


      box.innerHTML = `

        <div class="loading">

          <h3>
            Unable to load products
          </h3>

          <p>
            ${escapeHtml(
              result.error.message
            )}
          </p>

        </div>

      `;

      return;

    }


    allProducts =
      result.data || [];


    window.currentProducts =
      allProducts;


    console.log(
      "PRODUCT DATA:",
      allProducts
    );


    displayProducts(
      allProducts
    );


  } catch (error) {

    console.error(
      "Products error:",
      error
    );


    box.innerHTML = `

      <div class="loading">

        <h3>
          Something went wrong
        </h3>

        <p>
          ${escapeHtml(
            error.message
          )}
        </p>

      </div>

    `;

  }

}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(
  products
) {

  const box =
    document.getElementById(
      "products"
    );

  if (!box) return;


  if (
    !products ||
    products.length === 0
  ) {

    box.innerHTML = `

      <div class="loading">

        <h3>
          No products available
        </h3>

        <p>
          Please check again later.
        </p>

      </div>

    `;

    return;

  }


  box.innerHTML =
    products
      .map(
        function (product) {

          const price =
            Number(
              product.price
            ) || 0;


          const discount =
            product.discount_price !== null &&
            product.discount_price !== undefined &&
            Number(
              product.discount_price
            ) > 0
              ? Number(
                  product.discount_price
                )
              : null;


          const finalPrice =
            discount !== null
              ? discount
              : price;


          const image =
            product.image_url ||
            "https://via.placeholder.com/500x500?text=MAYA+CLOTHING";


          const stock =
            Number(
              product.stock
            ) || 0;


          return `

            <div class="product">

              <img
                src="${escapeAttribute(
                  image
                )}"
                alt="${escapeAttribute(
                  product.name
                )}"
                loading="lazy"
                onerror="
                  this.src='https://via.placeholder.com/500x500?text=MAYA+CLOTHING'
                "
              >


              <div class="product-info">

                <h3>
                  ${escapeHtml(
                    product.name
                  )}
                </h3>


                <div class="price">

                  ₦${finalPrice.toLocaleString()}


                  ${
                    discount !== null
                      ? `

                        <span class="old-price">

                          ₦${price.toLocaleString()}

                        </span>

                      `
                      : ""
                  }

                </div>


                <div class="stock">

                  ${
                    stock > 0
                      ? `In Stock: ${stock}`
                      : `Out of Stock`
                  }

                </div>


                <button
                  class="add-btn"
                  type="button"
                  onclick="addToCart(${Number(
                    product.id
                  )})"
                  ${
                    stock <= 0
                      ? "disabled"
                      : ""
                  }
                >

                  ${
                    stock > 0
                      ? "🛒 Add to Cart"
                      : "Out of Stock"
                  }

                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");

}


// ==========================================
// FILTER CATEGORY
// ==========================================

async function filterCategory(
  categoryId
) {

  const box =
    document.getElementById(
      "products"
    );

  if (!box) return;


  box.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;


  try {

    const result =
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
          created_at
        `)
        .eq(
          "is_active",
          true
        )
        .eq(
          "category_id",
          categoryId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (result.error) {

      console.error(
        "Category products error:",
        result.error
      );


      box.innerHTML = `

        <div class="loading">

          <h3>
            Unable to load products
          </h3>

          <p>
            ${escapeHtml(
              result.error.message
            )}
          </p>

        </div>

      `;

      return;

    }


    const products =
      result.data || [];


    window.currentProducts =
      products;


    displayProducts(
      products
    );


  } catch (error) {

    console.error(
      "Filter error:",
      error
    );

  }

}


// ==========================================
// SEARCH
// ==========================================

function searchProducts() {

  const input =
    document.getElementById(
      "search"
    );

  if (!input) return;


  const text =
    input.value
      .trim()
      .toLowerCase();


  if (!text) {

    window.currentProducts =
      allProducts;

    displayProducts(
      allProducts
    );

    return;

  }


  const filtered =
    allProducts.filter(
      function (product) {

        const name =
          String(
            product.name || ""
          ).toLowerCase();


        const description =
          String(
            product.description || ""
          ).toLowerCase();


        return (
          name.includes(text) ||
          description.includes(text)
        );

      }
    );


  window.currentProducts =
    filtered;


  displayProducts(
    filtered
  );

}


// ==========================================
// ADD TO CART
// ==========================================

function addToCart(
  productId
) {

  const product =
    allProducts.find(
      function (item) {

        return (
          Number(item.id) ===
          Number(productId)
        );

      }
    );


  if (!product) {

    alert(
      "Product not found."
    );

    return;

  }


  const stock =
    Number(
      product.stock
    ) || 0;


  if (stock <= 0) {

    alert(
      "This product is out of stock."
    );

    return;

  }


  const existing =
    cart.find(
      function (item) {

        return (
          Number(item.id) ===
          Number(productId)
        );

      }
    );


  if (existing) {

    if (
      existing.quantity >=
      stock
    ) {

      alert(
        "You cannot add more than available stock."
      );

      return;

    }


    existing.quantity++;

  } else {

    const price =
      product.discount_price !== null &&
      product.discount_price !== undefined &&
      Number(
        product.discount_price
      ) > 0
        ? Number(
            product.discount_price
          )
        : Number(
            product.price
          ) || 0;


    cart.push({

      id:
        Number(
          product.id
        ),

      name:
        product.name,

      price:
        price,

      image_url:
        product.image_url || "",

      stock:
        stock,

      quantity:
        1

    });

  }


  saveCart();

  updateCart();

  alert(
    "Product added to cart ✅"
  );

}


// ==========================================
// LOAD CART
// ==========================================

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        "maya_cart"
      );


    cart =
      saved
        ? JSON.parse(saved)
        : [];


    if (
      !Array.isArray(cart)
    ) {

      cart = [];

    }


  } catch (error) {

    console.error(
      "Cart error:",
      error
    );


    cart = [];

  }

}


// ==========================================
// SAVE CART
// ==========================================

function saveCart() {

  localStorage.setItem(
    "maya_cart",
    JSON.stringify(
      cart
    )
  );

}


// ==========================================
// UPDATE CART COUNT
// ==========================================

function updateCart() {

  const count =
    document.getElementById(
      "cartCount"
    );

  if (!count) return;


  const total =
    cart.reduce(
      function (
        sum,
        item
      ) {

        return (
          sum +
          Number(
            item.quantity || 0
          )
        );

      },
      0
    );


  count.textContent =
    total;

}


// ==========================================
// OPEN CART
// ==========================================

function openCart() {

  renderCart();


  const modal =
    document.getElementById(
      "cartModal"
    );


  if (modal) {

    modal.style.display =
      "block";

  }

}


// ==========================================
// CLOSE CART
// ==========================================

function closeCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


// ==========================================
// RENDER CART
// ==========================================

function renderCart() {

  const itemsBox =
    document.getElementById(
      "cartItems"
    );

  const totalBox =
    document.getElementById(
      "cartTotal"
    );


  if (
    !itemsBox ||
    !totalBox
  ) return;


  if (
    cart.length === 0
  ) {

    itemsBox.innerHTML = `

      <div class="cart-empty">

        Your cart is empty.

      </div>

    `;


    totalBox.textContent =
      "₦0";


    return;

  }


  itemsBox.innerHTML =
    cart
      .map(
        function (item) {

          const subtotal =
            Number(
              item.price
            ) *
            Number(
              item.quantity
            );


          const image =
            item.image_url ||
            "https://via.placeholder.com/100";


          return `

            <div class="cart-item">

              <img
                src="${escapeAttribute(
                  image
                )}"
                alt="${escapeAttribute(
                  item.name
                )}"
              >


              <div class="cart-item-info">

                <h4>
                  ${escapeHtml(
                    item.name
                  )}
                </h4>


                <div class="cart-price">

                  ₦${Number(
                    item.price
                  ).toLocaleString()}

                </div>


                <div class="quantity-controls">

                  <button
                    type="button"
                    onclick="changeQuantity(
                      ${Number(item.id)},
                      -1
                    )"
                  >
                    −
                  </button>


                  <span>
                    ${Number(
                      item.quantity
                    )}
                  </span>


                  <button
                    type="button"
                    onclick="changeQuantity(
                      ${Number(item.id)},
                      1
                    )"
                  >
                    +
                  </button>

                </div>


                <strong>

                  ₦${subtotal.toLocaleString()}

                </strong>


                <br>


                <button
                  type="button"
                  class="remove-btn"
                  onclick="removeFromCart(
                    ${Number(item.id)}
                  )"
                >
                  Remove
                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");


  const total =
    cart.reduce(
      function (
        sum,
        item
      ) {

        return (
          sum +
          Number(
            item.price
          ) *
          Number(
            item.quantity
          )
        );

      },
      0
    );


  totalBox.textContent =
    "₦" +
    total.toLocaleString();

}


// ==========================================
// CHANGE QUANTITY
// ==========================================

function changeQuantity(
  productId,
  change
) {

  const item =
    cart.find(
      function (item) {

        return (
          Number(item.id) ===
          Number(productId)
        );

      }
    );


  if (!item) return;


  const quantity =
    Number(
      item.quantity
    ) +
    Number(
      change
    );


  if (
    quantity <= 0
  ) {

    removeFromCart(
      productId
    );

    return;

  }


  if (
    quantity >
    Number(
      item.stock
    )
  ) {

    alert(
      "Not enough stock available."
    );

    return;

  }


  item.quantity =
    quantity;


  saveCart();

  updateCart();

  renderCart();

}


// ==========================================
// REMOVE FROM CART
// ==========================================

function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      function (item) {

        return (
          Number(item.id) !==
          Number(productId)
        );

      }
    );


  saveCart();

  updateCart();

  renderCart();

}


// ==========================================
// CHECKOUT
// ==========================================

function checkout() {

  if (
    cart.length === 0
  ) {

    alert(
      "Your cart is empty."
    );

    return;

  }


  alert(
    "Checkout zai zo a mataki na gaba."
  );

}


// ==========================================
// SCROLL TO SHOP
// ==========================================

function scrollToShop() {

  const shop =
    document.getElementById(
      "shop"
    );


  if (shop) {

    shop.scrollIntoView({
      behavior: "smooth"
    });

  }

}


// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(
  amount
) {

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }
  ).format(
    Number(
      amount
    ) || 0
  );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.loadProducts =
  loadProducts;

window.filterCategory =
  filterCategory;

window.searchProducts =
  searchProducts;

window.addToCart =
  addToCart;

window.openCart =
  openCart;

window.closeCart =
  closeCart;

window.changeQuantity =
  changeQuantity;

window.removeFromCart =
  removeFromCart;

window.checkout =
  checkout;

window.scrollToShop =
  scrollToShop;
