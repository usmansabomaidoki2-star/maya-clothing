// ======================================================
// MAYA CLOTHING - COMPLETE CUSTOMER APP
// ======================================================

// ------------------------------
// SUPABASE
// ------------------------------

const SUPABASE_URL =
  "https://shvugtyxmcwsvlpnadjp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_P-hHYPOXYivzKvQgSxud1A_pr3yFawF";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ------------------------------
// GLOBAL DATA
// ------------------------------

let allProducts = [];
let cart = [];


// ======================================================
// START APP
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log("MAYA CLOTHING APP STARTED");

    loadCart();

    updateCart();

    loadCategories();

    loadProducts();

  }
);


// ======================================================
// LOAD CATEGORIES
// ======================================================

async function loadCategories() {

  const box =
    document.getElementById("categories");

  if (!box) return;

  try {

    const result =
      await supabaseClient
        .from("categories")
        .select("id,name,slug")
        .order("id", {
          ascending: true
        });


    console.log(
      "CATEGORIES RESULT:",
      result
    );


    if (result.error) {

      console.error(
        "CATEGORY ERROR:",
        result.error
      );

      return;
    }


    const categories =
      result.data || [];


    box.innerHTML = `
      <button
        class="category-btn active"
        onclick="loadProducts()"
      >
        All
      </button>
    `;


    categories.forEach(
      function (category) {

        const button =
          document.createElement("button");

        button.className =
          "category-btn";

        button.textContent =
          category.name;

        button.onclick =
          function () {

            loadProducts(
              category.id
            );

          };

        box.appendChild(button);

      }
    );


  } catch (error) {

    console.error(
      "LOAD CATEGORY ERROR:",
      error
    );

  }

}


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts(
  categoryId = null
) {

  const box =
    document.getElementById("products");


  if (!box) {

    console.error(
      "Products container not found"
    );

    return;
  }


  box.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;


  try {

    console.log(
      "Loading products..."
    );


    let query =
      supabaseClient
        .from("products")
        .select(
          "id,name,description,price,discount_price,category_id,stock,image_url,sizes,colors"
        )
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


    if (categoryId) {

      query =
        query.eq(
          "category_id",
          categoryId
        );

    }


    const result =
      await query;


    console.log(
      "PRODUCT RESULT:",
      result
    );


    if (result.error) {

      console.error(
        "PRODUCT ERROR:",
        result.error
      );


      box.innerHTML = `
        <div class="loading">
          <h3>❌ Error Loading Products</h3>

          <p>
            ${escapeHTML(
              result.error.message
            )}
          </p>
        </div>
      `;

      return;
    }


    allProducts =
      result.data || [];


    console.log(
      "PRODUCTS:",
      allProducts
    );


    if (
      allProducts.length === 0
    ) {

      box.innerHTML = `
        <div class="loading">
          No products available.
        </div>
      `;

      return;
    }


    displayProducts(
      allProducts
    );


  } catch (error) {

    console.error(
      "PRODUCT LOAD FAILED:",
      error
    );


    box.innerHTML = `
      <div class="loading">

        <h3>
          ❌ Something went wrong
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>
    `;

  }

}


// ======================================================
// DISPLAY PRODUCTS
// ======================================================

function displayProducts(
  products
) {

  const box =
    document.getElementById(
      "products"
    );


  if (!box) return;


  box.innerHTML = "";


  if (
    !products ||
    products.length === 0
  ) {

    box.innerHTML = `
      <div class="loading">
        No products found.
      </div>
    `;

    return;
  }


  products.forEach(
    function (product) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "product-card";


      const originalPrice =
        Number(
          product.price || 0
        );


      const discountPrice =
        product.discount_price !== null &&
        product.discount_price !== undefined
          ? Number(
              product.discount_price
            )
          : null;


      const hasDiscount =
        discountPrice !== null &&
        discountPrice > 0 &&
        discountPrice < originalPrice;


      const finalPrice =
        hasDiscount
          ? discountPrice
          : originalPrice;


      const image =
        product.image_url ||
        "https://placehold.co/600x600?text=MAYA+CLOTHING";


      let priceHTML;


      if (hasDiscount) {

        priceHTML = `
          <div class="product-price">

            <span class="old-price">
              ${money(originalPrice)}
            </span>

            <span class="sale-price">
              ${money(discountPrice)}
            </span>

          </div>
        `;

      } else {

        priceHTML = `
          <div class="product-price">

            <span class="sale-price">
              ${money(finalPrice)}
            </span>

          </div>
        `;

      }


      const stock =
        Number(
          product.stock || 0
        );


      card.innerHTML = `

        <div class="product-image-box">

          <img
            src="${escapeAttribute(image)}"
            alt="${escapeAttribute(product.name)}"
            class="product-image"
            loading="lazy"
            onerror="
              this.src='https://placehold.co/600x600?text=MAYA+CLOTHING'
            "
          >

        </div>


        <div class="product-info">

          <h3>
            ${escapeHTML(
              product.name
            )}
          </h3>


          ${
            product.description
              ? `
                <p class="product-description">
                  ${escapeHTML(
                    product.description
                  )}
                </p>
              `
              : ""
          }


          ${priceHTML}


          <p class="product-stock">

            ${
              stock > 0
                ? `Stock: ${stock}`
                : "Out of stock"
            }

          </p>


          <button
            class="add-cart-btn"
            onclick="
              addToCart(${product.id})
            "
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

      `;


      box.appendChild(card);

    }
  );

}


// ======================================================
// SEARCH
// ======================================================

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


  displayProducts(
    filtered
  );

}


// ======================================================
// CART
// ======================================================

function addToCart(
  productId
) {

  const product =
    allProducts.find(
      function (item) {

        return Number(item.id) ===
          Number(productId);

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
      product.stock || 0
    );


  if (stock <= 0) {

    alert(
      "This product is out of stock."
    );

    return;
  }


  const existing =
    cart.find(
      function (item) {

        return Number(item.id) ===
          Number(productId);

      }
    );


  if (existing) {

    if (
      existing.quantity >=
      stock
    ) {

      alert(
        `Only ${stock} item(s) available.`
      );

      return;
    }


    existing.quantity += 1;

  } else {

    cart.push({

      id: product.id,

      name: product.name,

      price:
        Number(
          product.price || 0
        ),

      discount_price:
        product.discount_price !== null
          ? Number(
              product.discount_price
            )
          : null,

      image_url:
        product.image_url,

      stock: stock,

      quantity: 1

    });

  }


  saveCart();

  updateCart();

}


// ======================================================
// PRODUCT PRICE
// ======================================================

function getFinalPrice(
  item
) {

  const price =
    Number(
      item.price || 0
    );


  const discount =
    item.discount_price !== null &&
    item.discount_price !== undefined
      ? Number(
          item.discount_price
        )
      : null;


  if (
    discount !== null &&
    discount > 0 &&
    discount < price
  ) {

    return discount;

  }


  return price;

}


// ======================================================
// CART COUNT
// ======================================================

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


// ======================================================
// OPEN CART
// ======================================================

function openCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );


  if (!modal) return;


  renderCart();


  modal.style.display =
    "flex";


  modal.classList.add(
    "show"
  );

}


// ======================================================
// CLOSE CART
// ======================================================

function closeCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );


  if (!modal) return;


  modal.style.display =
    "none";


  modal.classList.remove(
    "show"
  );

}


// ======================================================
// RENDER CART
// ======================================================

function renderCart() {

  const box =
    document.getElementById(
      "cartItems"
    );


  const totalBox =
    document.getElementById(
      "cartTotal"
    );


  if (!box) return;


  if (
    cart.length === 0
  ) {

    box.innerHTML = `
      <div class="empty-cart">
        🛒 Your cart is empty.
      </div>
    `;


    if (totalBox) {

      totalBox.textContent =
        "₦0";

    }


    return;
  }


  box.innerHTML = "";


  let total = 0;


  cart.forEach(
    function (item) {

      const price =
        getFinalPrice(
          item
        );


      const subtotal =
        price *
        Number(
          item.quantity || 0
        );


      total +=
        subtotal;


      const image =
        item.image_url ||
        "https://placehold.co/150x150?text=MAYA";


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "cart-item";


      row.innerHTML = `

        <div class="cart-item-image">

          <img
            src="${escapeAttribute(image)}"
            alt="${escapeAttribute(item.name)}"
            onerror="
              this.src='https://placehold.co/150x150?text=MAYA'
            "
          >

        </div>


        <div class="cart-item-info">

          <h4>
            ${escapeHTML(
              item.name
            )}
          </h4>


          <p>
            ${money(price)}
          </p>


          <div class="quantity-controls">

            <button
              onclick="
                changeQuantity(
                  ${item.id},
                  -1
                )
              "
            >
              −
            </button>


            <span>
              ${item.quantity}
            </span>


            <button
              onclick="
                changeQuantity(
                  ${item.id},
                  1
                )
              "
            >
              +
            </button>

          </div>


          <strong>
            ${money(subtotal)}
          </strong>


          <br>


          <button
            class="remove-btn"
            onclick="
              removeFromCart(
                ${item.id}
              )
            "
          >
            Remove
          </button>

        </div>

      `;


      box.appendChild(row);

    }
  );


  if (totalBox) {

    totalBox.textContent =
      money(total);

  }

}


// ======================================================
// CHANGE QUANTITY
// ======================================================

function changeQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      function (cartItem) {

        return Number(
          cartItem.id
        ) === Number(
          productId
        );

      }
    );


  if (!item) return;


  const newQuantity =
    Number(
      item.quantity
    ) +
    Number(amount);


  if (
    newQuantity <= 0
  ) {

    removeFromCart(
      productId
    );

    return;
  }


  if (
    newQuantity >
    Number(
      item.stock || 0
    )
  ) {

    alert(
      `Only ${item.stock} item(s) available.`
    );

    return;
  }


  item.quantity =
    newQuantity;


  saveCart();

  updateCart();

  renderCart();

}


// ======================================================
// REMOVE ITEM
// ======================================================

function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      function (item) {

        return Number(
          item.id
        ) !== Number(
          productId
        );

      }
    );


  saveCart();

  updateCart();

  renderCart();

}


// ======================================================
// SAVE CART
// ======================================================

function saveCart() {

  localStorage.setItem(
    "maya_clothing_cart",
    JSON.stringify(cart)
  );

}


// ======================================================
// LOAD CART
// ======================================================

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        "maya_clothing_cart"
      );


    if (saved) {

      const parsed =
        JSON.parse(saved);


      if (
        Array.isArray(parsed)
      ) {

        cart =
          parsed;

      }

    }

  } catch (error) {

    console.error(
      "CART LOAD ERROR:",
      error
    );

    cart = [];

  }

}


// ======================================================
// CHECKOUT
// ======================================================

function openCheckout() {

  if (
    cart.length === 0
  ) {

    alert(
      "Your cart is empty."
    );

    return;
  }


  const cartModal =
    document.getElementById(
      "cartModal"
    );


  const checkoutModal =
    document.getElementById(
      "checkoutModal"
    );


  if (cartModal) {

    cartModal.style.display =
      "none";

  }


  if (checkoutModal) {

    checkoutModal.style.display =
      "flex";

    checkoutModal.classList.add(
      "show"
    );

  }


  updateCheckoutTotal();

}


// ======================================================
// CLOSE CHECKOUT
// ======================================================

function closeCheckout() {

  const modal =
    document.getElementById(
      "checkoutModal"
    );


  if (!modal) return;


  modal.style.display =
    "none";

  modal.classList.remove(
    "show"
  );

}


// ======================================================
// CHECKOUT TOTAL
// ======================================================

function updateCheckoutTotal() {

  const box =
    document.getElementById(
      "checkoutTotal"
    );


  if (!box) return;


  const total =
    calculateCartTotal();


  box.textContent =
    money(total);

}


// ======================================================
// CART TOTAL
// ======================================================

function calculateCartTotal() {

  return cart.reduce(
    function (
      total,
      item
    ) {

      return (
        total +
        (
          getFinalPrice(
            item
          ) *
          Number(
            item.quantity || 0
          )
        )
      );

    },
    0
  );

}


// ======================================================
// PLACE ORDER
// ======================================================

async function submitOrder(
  event
) {

  event.preventDefault();


  const button =
    document.getElementById(
      "placeOrderBtn"
    );


  const message =
    document.getElementById(
      "checkoutMessage"
    );


  if (
    cart.length === 0
  ) {

    showMessage(
      "Your cart is empty.",
      true
    );

    return;
  }


  const customerName =
    document.getElementById(
      "customerName"
    )?.value.trim();


  const customerPhone =
    document.getElementById(
      "customerPhone"
    )?.value.trim();


  const customerWhatsapp =
    document.getElementById(
      "customerWhatsapp"
    )?.value.trim();


  const customerEmail =
    document.getElementById(
      "customerEmail"
    )?.value.trim();


  const customerAddress =
    document.getElementById(
      "customerAddress"
    )?.value.trim();


  const customerCity =
    document.getElementById(
      "customerCity"
    )?.value.trim();


  const customerState =
    document.getElementById(
      "customerState"
    )?.value.trim();


  const orderNotes =
    document.getElementById(
      "orderNotes"
    )?.value.trim();


  if (!customerName) {

    showMessage(
      "Please enter your full name.",
      true
    );

    return;
  }


  if (!customerPhone) {

    showMessage(
      "Please enter your phone number.",
      true
    );

    return;
  }


  if (!customerAddress) {

    showMessage(
      "Please enter your delivery address.",
      true
    );

    return;
  }


  const items =
    cart.map(
      function (item) {

        return {

          product_id:
            Number(
              item.id
            ),

          quantity:
            Number(
              item.quantity
            )

        };

      }
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Placing Order...";

  }


  showMessage(
    "Please wait..."
  );


  try {

    const result =
      await supabaseClient.rpc(
        "create_order",
        {
          p_customer_name:
            customerName,

          p_phone:
            customerPhone,

          p_whatsapp:
            customerWhatsapp ||
            null,

          p_email:
            customerEmail ||
            null,

          p_address:
            customerAddress,

          p_city:
            customerCity ||
            null,

          p_state:
            customerState ||
            null,

          p_notes:
            orderNotes ||
            null,

          p_items:
            items
        }
      );


    console.log(
      "ORDER RESULT:",
      result
    );


    if (result.error) {

      showMessage(
        result.error.message,
        true
      );

      return;
    }


    const response =
      result.data;


    if (
      !response ||
      response.success !== true
    ) {

      showMessage(
        response?.message ||
        "Order could not be placed.",
        true
      );

      return;
    }


    const orderId =
      response.order_id;


    cart = [];


    saveCart();

    updateCart();


    const form =
      document.getElementById(
        "checkoutForm"
      );


    if (form) {

      form.reset();

    }


    showMessage(
      `✅ Order placed successfully! Order ID: #${orderId}`
    );


    if (button) {

      button.textContent =
        "Order Placed";

    }


    setTimeout(
      function () {

        closeCheckout();

        if (button) {

          button.disabled =
            false;

          button.textContent =
            "Place Order";

        }

        if (message) {

          message.textContent =
            "";

        }

      },
      4000
    );


  } catch (error) {

    console.error(
      "ORDER ERROR:",
      error
    );


    showMessage(
      error.message ||
      "Something went wrong.",
      true
    );


  } finally {

    if (
      button &&
      button.textContent !==
        "Order Placed"
    ) {

      button.disabled =
        false;

      button.textContent =
        "Place Order";

    }

  }

}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
  text,
  error = false
) {

  const box =
    document.getElementById(
      "checkoutMessage"
    );


  if (!box) return;


  box.textContent =
    text;


  box.style.display =
    "block";


  box.style.padding =
    "10px";


  box.style.marginTop =
    "10px";


  box.style.borderRadius =
    "8px";


  if (error) {

    box.style.background =
      "#ffe5e5";

    box.style.color =
      "#b00020";

  } else {

    box.style.background =
      "#e7f8ed";

    box.style.color =
      "#137333";

  }

}


// ======================================================
// SCROLL TO SHOP
// ======================================================

function scrollToShop() {

  const shop =
    document.getElementById(
      "shop"
    );


  if (!shop) return;


  shop.scrollIntoView({
    behavior: "smooth"
  });

}


// ======================================================
// CATEGORY FILTER
// ======================================================

function filterCategory(
  categoryId
) {

  loadProducts(
    categoryId
  );

}


// ======================================================
// MONEY
// ======================================================

function money(
  value
) {

  return (
    "₦" +
    Number(
      value || 0
    ).toLocaleString(
      "en-NG",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )
  );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
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


// ======================================================
// ESCAPE ATTRIBUTE
// ======================================================

function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}


// ======================================================
// CLOSE MODALS BY OUTSIDE CLICK
// ======================================================

window.addEventListener(
  "click",
  function (event) {

    const cartModal =
      document.getElementById(
        "cartModal"
      );


    const checkoutModal =
      document.getElementById(
        "checkoutModal"
      );


    if (
      cartModal &&
      event.target ===
        cartModal
    ) {

      closeCart();

    }


    if (
      checkoutModal &&
      event.target ===
        checkoutModal
    ) {

      closeCheckout();

    }

  }
);


// ======================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ======================================================

window.loadProducts =
  loadProducts;

window.loadCategories =
  loadCategories;

window.filterCategory =
  filterCategory;

window.searchProducts =
  searchProducts;

window.addToCart =
  addToCart;

window.changeQuantity =
  changeQuantity;

window.removeFromCart =
  removeFromCart;

window.openCart =
  openCart;

window.closeCart =
  closeCart;

window.openCheckout =
  openCheckout;

window.closeCheckout =
  closeCheckout;

window.submitOrder =
  submitOrder;

window.scrollToShop =
  scrollToShop;


// ======================================================
// FINAL TEST
// ======================================================

console.log(
  "MAYA CLOTHING app.js loaded successfully."
);
