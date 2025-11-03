const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
const cartList = document.querySelector(".shoppingCart-tableList");

let dataArr = [];
let CartData = [];

function init() {
  getProductList();
  getCartList();
}
init();

// ======= 產品清單 =======
function getProductList() {
  axios
    .get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`)
    .then(function (response) {
      dataArr = response.data.products;
      renderProductList(dataArr);
    })
    .catch((error) => {
      console.error("資料載入失敗", error);
    });
}

function renderProductList(list) {
  let str = ``;
  list.forEach((item) => {
    str += `<li class="productCard">
              <h4 class="productType">新品</h4>
              <img src="${item.images}" alt="">
              <a href="#" class="addCardBtn" data-id="${item.id}">加入購物車</a>
              <h3>${item.title}</h3>
              <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
              <p class="nowPrice">NT$${toThousands(item.price)}</p>
            </li>`;
  });
  productList.innerHTML = str;
}

productSelect.addEventListener("change", function (e) {
  const category = e.target.value;
  if (category === "全部") {
    renderProductList(dataArr);
    return;
  }
  const filterData = dataArr.filter((item) => item.category === category);
  renderProductList(filterData);
});

// ======= 加入購物車 =======
productList.addEventListener("click", function (e) {
  e.preventDefault();
  if (e.target.className !== "addCardBtn") return;

  const productId = e.target.getAttribute("data-id");
  let numCheck = 1;

  CartData.forEach(function (item) {
    if (item.product.id === productId) {
      numCheck = item.quantity += 1;
    }
  });

  axios
    .post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`, {
      data: { productId, quantity: numCheck },
    })
    .then(function () {
      alert("加入購物車");
      getCartList();
    });
});

// ======= 購物車列表 =======
function getCartList() {
  axios
    .get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function (response) {
      document.querySelector(".js-total").textContent = toThousands(response.data.finalTotal);
      CartData = response.data.carts;
      let str = "";
      CartData.forEach(function (item) {
        str += `<tr>
          <td>
            <div class="cardItem-title">
              <img src="${item.product.images}" alt="">
              <p>${item.product.title}</p>
            </div>
          </td>
          <td>NT$${toThousands(item.product.price)}</td>
          <td>${item.quantity}</td>
          <td>NT$${toThousands(item.product.price * item.quantity)}</td>
          <td class="discardBtn">
            <a href="#" class="material-icons" data-id="${item.id}"> clear </a>
          </td>
        </tr>`;
      });
      cartList.innerHTML = str;
    })
    .catch((error) => console.error("資料載入失敗", error));
}

cartList.addEventListener("click", function (e) {
  e.preventDefault();
  const cartId = e.target.getAttribute("data-id");
  if (!cartId) return alert("你點到其它東西了");

  axios
    .delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
    .then(function () {
      alert("刪除單筆購物車成功");
      getCartList();
    });
});

// ======= 刪除全部購物車 =======
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  axios
    .delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function () {
      alert("刪除全部購物車成功");
      getCartList();
    })
    .catch(function () {
      alert("購物車已清空，請勿重複點擊");
    });
});

// ======= 表單驗證 =======
const form = document.querySelector(".orderInfo-form");
const inputs = form.querySelectorAll("input[name], select[name]");

const constraints = {
  "姓名": {
    presence: { allowEmpty: false, message: "必填欄位" },
  },
  "電話": {
    presence: { allowEmpty: false, message: "必填欄位" },
    format: { pattern: /^09\\d{8}$/, message: "格式錯誤，需為09開頭共10碼" },
  },
  "Email": {
    presence: { allowEmpty: false, message: "必填欄位" },
    email: { message: "格式錯誤" },
  },
  "寄送地址": {
    presence: { allowEmpty: false, message: "必填欄位" },
  },
  "交易方式": {
    presence: { allowEmpty: false, message: "必填欄位" },
  },
};

// === 即時驗證：blur、change、input ===
inputs.forEach((item) => {
  item.addEventListener("input", validateField);
  item.addEventListener("blur", validateField);
  item.addEventListener("change", validateField);
});

function validateField(e) {
  const item = e.target;
  const name = item.name;
  const value = item.value.trim();
  const msgEl = form.querySelector(`[data-message="${name}"]`);

  msgEl.style.display = "none";
  msgEl.textContent = "";
  item.classList.remove("input-error");

  const error = validate.single(value, constraints[name]);
  if (error) {
    msgEl.style.display = "block";
    msgEl.textContent = error[0];
    item.classList.add("input-error");
  }
}

// ======= 送出訂單 =======
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click", function (e) {
  e.preventDefault();

  if (CartData.length === 0) {
    alert("請加入購物車");
    return;
  }

  // 驗證整份表單
  const formData = validate.collectFormValues(form);
  const errors = validate(formData, constraints);

  // 清除錯誤狀態
  form.querySelectorAll(".orderInfo-message").forEach((msg) => {
    msg.style.display = "none";
    msg.textContent = "";
  });
  form.querySelectorAll(".orderInfo-input, select[name]").forEach((input) => {
    input.classList.remove("input-error");
  });

  if (errors) {
    Object.keys(errors).forEach((key) => {
      const msgEl = form.querySelector(`[data-message="${key}"]`);
      const inputEl = form.querySelector(`[name="${key}"]`);
      if (msgEl) {
        msgEl.style.display = "block";
        msgEl.textContent = errors[key][0];
      }
      if (inputEl) {
        inputEl.classList.add("input-error");
      }
    });
    alert("請修正表單錯誤再送出");
    return;
  }

  // 驗證通過 → 送出訂單
  const customerName = document.querySelector("#customerName").value;
  const customerPhone = document.querySelector("#customerPhone").value;
  const customerEmail = document.querySelector("#customerEmail").value;
  const customerAddress = document.querySelector("#customerAddress").value;
  const customertradeWay = document.querySelector("#tradeWay").value;

  axios
    .post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`, {
      data: {
        user: {
          name: customerName,
          tel: customerPhone,
          email: customerEmail,
          address: customerAddress,
          payment: customertradeWay,
        },
      },
    })
    .then(function () {
      alert("訂單建立成功");
      form.reset();
      getCartList();
    });
});

// ======= 千分位工具 =======
function toThousands(num) {
  const [integer, decimal] = num.toString().split(".");
  const formatted = integer.replace(/\B(?=(\\d{3})+(?!\\d))/g, ",");
  return decimal ? `${formatted}.${decimal}` : formatted;
}
