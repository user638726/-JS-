let orderData = [];
const orderList = document.querySelector(".js-orderList");
function init() {
  getOrderList();
}
init();
function renderC3(){
  //物件資料蒐集
  console.log(orderData);
  let total = {};
  orderData.forEach(function(item){
    item.products.forEach(function(productItem){
      if(total[productItem.category] == undefined){
        total[productItem.category] = productItem.price*productItem.quantity;
      }else{
        total[productItem.category] += productItem.price * productItem.quantity;
      }
    })
  })
  console.log(total);
  //做出資料關聯
  let categoryAry = Object.keys(total);
  console.log(categoryAry);
  let newData = [];
  categoryAry.forEach(function(item){
    let ary = [];
    ary.push(item);
    ary.push(total[item]);
    newData.push(ary);
  })
  console.log(newData);

  let chart = c3.generate({
    bindto: '#chart', // HTML 元素綁定
    data: {
        type: "pie",
        columns: newData
    },
});
}
function renderC3_lv2(){

  let total = {};
  orderData.forEach(function(item){
    item.products.forEach(function(productItem){
      if(total[productItem.title] == undefined){
        total[productItem.title] = productItem.price*productItem.quantity;
      }else{
        total[productItem.title] += productItem.price * productItem.quantity;
      }
    })
  })
  console.log(total);
  //做出資料關聯
  let originAry = Object.keys(total);
  console.log(originAry);
  let rankSortAry = [];
  originAry.forEach(function(item){
    let ary = [];
    ary.push(item);
    ary.push(total[item]);
    rankSortAry.push(ary);
  })
  
  //比大小，降冪排列
  rankSortAry.sort(function(a,b){
    return b[1]-a[1];
  })
  //如果筆數超過4筆以上，就統整為其它
  if(rankSortAry.length > 3){
    let otherTotal = 0;
    rankSortAry.forEach(function(item,index){
      if(index > 2){
        otherTotal += rankSortAry[index][1];
      }
    })
    rankSortAry.splice(3,rankSortAry.length-1);
    rankSortAry.push(['其他',otherTotal]);
  }
  console.log(rankSortAry);
  let chart = c3.generate({
    bindto: '#chart', // HTML 元素綁定
    data: {
        type: "pie",
        columns: rankSortAry
    },
});  
}
function getOrderList() {
  axios
    .get(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      console.log(response.data.orders);
      orderData = response.data.orders;
      let str = "";
      orderData.forEach(function (item) {
        //組時間字串
        const timeStamp = new Date(item.createdAt * 1000);
        const orderTime = `${timeStamp.getFullYear()}/${
          timeStamp.getMonth()
        }/${timeStamp.getDate()}`;
        console.log(orderTime);
        //組產品字串
        let productStr = "";
        item.products.forEach(function (productItem) {
          productStr += `<p>${productItem.title} x ${productItem.quantity}</p>`;
        });
        //判斷訂單狀態
        let orderStatus = "";
        if (item.paid == true) {
          orderStatus = "已處理";
        } else {
          orderStatus = "未處理";
        }

        //組訂單字串
        str += `<tr>
                    <td>${item.id}</td>
                    <td>
                      <p>${item.user.name}</p>
                      <p>${item.user.tel}</p>
                    </td>
                    <td>${item.user.address}</td>
                    <td>${item.user.email}</td>
                    <td>
                      ${productStr}
                    </td>
                    <td>${orderTime}</td>
                    <td class="js-orderStatus">
                      <a href="#" data-status="${item.paid}" class="orderStatus" data-id="${item.id}">${orderStatus}</a>
                    </td>
                    <td>
                      <input type="button" class="delSingleOrder-Btn  js-orderDelete" data-id="${item.id}" value="刪除">
                    </td>
                </tr>`;
      });
      orderList.innerHTML = str;
      renderC3_lv2();
    });
}

orderList.addEventListener("click", function (e) {
  e.preventDefault();
  const targetClass = e.target.getAttribute("class");
  let id = e.target.getAttribute("data-id");
  if (targetClass == "delSingleOrder-Btn  js-orderDelete") {
    deleteOrderItem(id);
    return;
  }
  if (targetClass == "orderStatus") {
    let status = e.target.getAttribute("data-status");

    changeOrderStatus(status, id);
    return;
  }
});

function changeOrderStatus(status, id) {
  // 將字串轉為布林
  let paidStatus = (status === "true"); // 轉成真正布林
  let newStatus = !paidStatus; 

  axios
    .put(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
      {
        data: {
          id: id,
          paid: newStatus,
        },
      },
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      alert("修改訂單狀態成功");
      getOrderList();
    });
}

function deleteOrderItem(id) {
  axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders/${id}`,
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      alert("刪除該筆訂單成功");
      getOrderList();
    });
}

const discardAllBtn = document.querySelector(".discardAllBtn")
discardAllBtn.addEventListener("click",function(e){
  e.preventDefault();
   axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(function (response) {
      alert("刪除全部訂單成功");
      getOrderList();
    });
})
