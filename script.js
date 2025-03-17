// 取得 API 基本 URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbzyUpVvD4n7fIHXlHf8erpfvjd9c_OtV12qz0I-TiRdymfiL5S4cXkPszOXlz3spRL5/exec";

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

// 🚀 讀取歷史資料
function loadHistory() {
    let type = document.getElementById("historyType").value; // 取得選擇的類型

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getHistoryData", type: type }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        let tableHeader = document.getElementById("tableHeader");
        let tableBody = document.getElementById("historyTable");

        // 清空現有資料
        tableHeader.innerHTML = "";
        tableBody.innerHTML = "";

        // 設定表頭
        let headers = [];
        if (type === "盤點") {
            headers = ["任務名稱", "項次", "項目", "單位", "儲備數", "盤點數", "狀態", "備註", "照片連結", "盤點人", "到點感應時間", "上傳時間", "部門"];
        } else if (type === "巡檢") {
            headers = ["任務名稱", "點位或項次", "項目", "狀態", "備註", "照片連結", "巡檢人", "到點感應時間", "上傳時間", "部門"];
        } else if (type === "異常處理") {
            headers = ["任務名稱", "點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註", "照片連結", "負責人", "到點感應時間", "上傳時間", "處理狀態", "複查情形", "複查照片連結", "複查時間", "主管", "批准或退回", "主管意見", "確認時間", "處理紀錄", "部門"];
        }

        // 生成表頭
        let headerRow = document.createElement("tr");
        headers.forEach(header => {
            let th = document.createElement("th");
            th.innerText = header;
            headerRow.appendChild(th);
        });
        tableHeader.appendChild(headerRow);

        // 填充表格數據
        data.forEach((row, index) => {
            if (index === 0) return; // 跳過標題列
            let tr = document.createElement("tr");
            row.forEach(cell => {
                let td = document.createElement("td");
                td.innerText = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    });
}

// 🚀 3. 主管審核 - 取得資料
function loadReviewData() {
    let role = localStorage.getItem("role");
    let department = localStorage.getItem("department");

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getPendingReviews", role: role, department: department }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        let select = document.getElementById("reviewList");
        select.innerHTML = "";
        data.forEach(row => {
            let option = document.createElement("option");
            option.value = row[0]; // 任務名稱
            option.innerText = row[0];
            select.appendChild(option);
        });
    });
}


// 🚀 4. 主管審核 - 提交
function submitReview(decision) {
    let taskName = document.getElementById("reviewList").value;
    let comment = document.getElementById("comment").value;
    let role = localStorage.getItem("role");
    let department = localStorage.getItem("department");

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "approveReview",
            taskName: taskName,
            decision: decision,
            comment: comment,
            role: role,
            department: department
        }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("審核成功，新的狀態：" + data.newStatus);
            location.reload();
        } else {
            alert("審核失敗：" + data.message);
        }
    });
}

