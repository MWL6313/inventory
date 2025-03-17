// 取得 API 基本 URL
const GAS_URL = "https://script.google.com/macros/s/你的GAS部署URL/exec";

// 🚀 1. 登入功能
function login() {
    let account = document.getElementById("account").value;
    let password = document.getElementById("password").value;

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "loginUser", account: account, password: password }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("department", data.department);
            localStorage.setItem("role", data.role);
            window.location.href = "dashboard.html";
        } else {
            document.getElementById("message").innerText = "登入失敗";
        }
    });
}

// 🚀 2. 讀取歷史資料
function loadHistory() {
    fetch(GAS_URL + "?action=getHistoryData")
    .then(response => response.json())
    .then(data => {
        let table = document.getElementById("historyTable");
        table.innerHTML = ""; // 清空現有資料

        data.forEach(row => {
            let tr = document.createElement("tr");
            row.forEach(cell => {
                let td = document.createElement("td");
                td.innerText = cell;
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
    });
}

// 🚀 3. 主管審核 - 取得資料
function loadReviewData() {
    let department = localStorage.getItem("department");

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getReviewData", department: department }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        let select = document.getElementById("reviewList");
        select.innerHTML = ""; // 清空選單
        data.forEach(row => {
            let option = document.createElement("option");
            option.value = row[0];
            option.innerText = row[0];
            select.appendChild(option);
        });
    });
}

// 🚀 4. 主管審核 - 提交
function submitReview() {
    let item = document.getElementById("reviewList").value;
    let comment = document.getElementById("comment").value;

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "updateReview", itemName: item, comment: comment }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("審核成功");
            location.reload();
        } else {
            alert("審核失敗");
        }
    });
}
